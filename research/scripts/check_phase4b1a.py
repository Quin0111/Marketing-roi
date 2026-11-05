"""Validate audit evidence; keep historical reproduction failures explicit."""
import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "research/outputs/phase4b1a"
OLD = ROOT / "research/outputs/phase4b1"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    result = json.loads((OUT / "audit_results.json").read_text(encoding="utf-8"))
    access = json.loads((OUT / "data_access.json").read_text(encoding="utf-8"))
    discovery = json.loads((OUT / "source_discovery.json").read_text(encoding="utf-8"))
    integrity = json.loads((OUT / "protected_integrity.json").read_text(encoding="utf-8"))
    protocol = json.loads((OUT / "phase4b2_evaluation_protocol.json").read_text(encoding="utf-8"))
    schedule = pd.read_csv(OUT / "frozen_outer_fold_schedule.csv")
    membership = pd.read_csv(OLD / "split_membership.csv")
    key = "csv_row_index_zero_based"
    dev_ids = membership.loc[membership.partition != "final_test_LOCKED", key].to_numpy()
    test_ids = set(membership.loc[membership.partition == "final_test_LOCKED", key])
    scores = pd.read_csv(OUT / "dummy_fold_metrics.csv")
    canonical = result["profiles"][0]
    rows = []

    def passed(code, label, condition, evidence):
        if not condition: raise AssertionError(f"{code}: {label}")
        rows.append({"id": code, "check": label, "status": "PASS", "evidence": evidence})

    def unresolved(code, label, evidence):
        rows.append({"id": code, "check": label, "status": "FAIL", "evidence": evidence})

    report_paths = ["research/phase4b1_data_audit.md", "research/phase4b1_feature_assessment.md", "research/phase4b1_recommendations.md"]
    protected_paths = {path.replace("\\", "/") for path in integrity["before"]}
    passed("R01", "Đọc và bảo toàn ba báo cáo Phase 4B.1", all(p in protected_paths for p in report_paths), "SHA256 ba báo cáo có trong protected_integrity.json")
    assert not any(item["contains_fivefold_code"] or item["contains_literal_historical_rmse_in_code"] for item in discovery["notebooks"])
    unresolved("R02", "Khôi phục mã và fold indices tạo benchmark lịch sử", "Chín notebook Marketing và phạm vi tìm script chưa có nguồn 5-Fold; archive chỉ chứa bảy artifact; Drive không có kết quả truy cập được")
    passed("R03", "Khôi phục membership/order Development mới đúng split gốc", access["parsed_rows"] == len(dev_ids) == 170000 and len(test_ids) == 30000, "Replay hai bước seed 42 khớp membership Phase 4B.1; không giao Test")
    previous = json.loads((OLD / "diagnostic_cv_summary.json").read_text(encoding="utf-8"))[0]["RMSE_mean"]
    passed("R04", "Tái lập RMSE mới bằng Dummy/cross_validate/pipeline", abs(canonical["mean_fold_RMSE"] - previous) < 1e-12
        and canonical["cross_validate_mean_fold_RMSE"] == canonical["pipeline_cross_validate_mean_fold_RMSE"] == canonical["mean_fold_RMSE"], "Mean RMSE = 1.7344738959662471; sai số với Phase 4B.1 < 1e-12")
    assert abs(result["canonical_new_rmse"] - result["historical_rmse_preserved"]) > 1e-6
    unresolved("R05", "Tái lập RMSE lịch sử 1.732275", f"Không khớp: chênh {result['difference_from_historical']:.16g}; số gốc giữ nguyên")
    first = scores[scores.profile == canonical["profile"]]
    pooled = np.sqrt(np.average(first.MSE, weights=first.assessment_rows))
    passed("R06", "Đối soát mean-fold và pooled OOF", abs(pooled - canonical["pooled_OOF_RMSE"]) < 1e-12
        and abs(first.RMSE.mean() - canonical["mean_fold_RMSE"]) < 1e-12, f"Gap = {result['mean_vs_pooled_gap']:.16g}, không đủ giải thích chênh lịch sử")
    passed("R07", "Kiểm tra ảnh hưởng preprocessing của Dummy", canonical["pipeline_vs_plain_max_fold_difference"] == 0, "Clone preprocessor trong research; max chênh fold = 0; không fit production")
    passed("R08", "Đối soát sai số số học", canonical["max_fsum_vs_sklearn_RMSE_difference"] < 1e-12
        and canonical["max_float32_vs_float64_RMSE_difference"] < 1e-6, "fsum và float32 sensitivity nhỏ hơn nhiều chênh cần giải thích")
    passed("R09", "Kiểm tra hữu hạn các khả năng mẫu/order/shuffle", len(result["profiles"]) == 6
        and all(abs(item["mean_fold_RMSE"] - result["historical_rmse_preserved"]) > 1e-6 for item in result["profiles"]), "Sáu profile đã ghi trước; không dò seed/split; một-step 85/15 không chấm vì giao Test")
    unresolved("R10", "Xác định duy nhất nguyên nhân của lần chạy lịch sử", "Thiếu dataset/row/fold/run provenance, raw scores và scoring code; không suy đoán thành sự thật")
    passed("R11", "Kiểm tra lại Date–Campaign_ID", result["date_check"]["exact_matches"] == 170000 and result["date_check"]["mismatches"] == 0
        and result["date_check"]["used_for_training"] is False, "170000/170000 khớp; Date không dùng để fit")
    passed("R12", "Không materialize ROI Test cho nghiên cứu", access["skiprows_before_roi_materialization"] and not access["test_roi_read_for_analysis"]
        and not access["split_joblib_loaded"] and not result["final_test_roi_read"] and set(schedule[key]).isdisjoint(test_ids), "skiprows trước DataFrame; không nạp split joblib; lịch folds chỉ có Development")
    assert integrity["before"] == integrity["after"]
    for path, value in integrity["before"].items():
        assert sha(ROOT / path) == value, path
    passed("R13", "Giữ nguyên production, artifact và lịch sử", True, f"{len(integrity['before'])} tệp được bảo vệ khớp hash trước/sau và hiện tại")
    for _, frame in schedule.groupby("repeat"):
        assert len(frame) == frame[key].nunique() == 170000
        assert set(frame[key]) == set(dev_ids)
        assert frame.groupby("assessment_fold").size().tolist() == [34000] * 5
    assert sha(OUT / "frozen_outer_fold_schedule.csv") == protocol["outer_cv"]["schedule_sha256"]
    passed("R14", "Đóng băng giao thức Development mới và lịch fold", len(schedule) == 510000
        and protocol["outer_cv"]["seeds"] == [42, 2026, 20261103], "DM-DEV-170K-v1; ba repeat, mỗi row được assessment đúng một lần/repeat; không có ROI")
    passed("R15", "Giữ Quality Gate BASELINE_ONLY", result["quality_gate"] == protocol["quality_gate"] == "BASELINE_ONLY"
        and protocol["optimization_allowed"] is False, "Không sửa metadata hoặc bật khuyến nghị")
    passed("R16", "Không thực hiện Phase 4B.2", result["phase4b2_started"] is False
        and protocol["status"] == "FROZEN_FOR_REVIEW_NOT_EXECUTED_PHASE4B2", "Chỉ Dummy đối soát và tạo lịch indices; không thuật toán nâng cấp/tuning")
    save = {"execution_status": "PASS", "historical_reproduction": "FAIL_NOT_REPRODUCED_MISSING_PROVENANCE",
            "pass_count": sum(row["status"] == "PASS" for row in rows), "fail_count": sum(row["status"] == "FAIL" for row in rows),
            "checks": rows}
    (OUT / "verification_checks.json").write_text(json.dumps(save, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Audit verification complete: {save['pass_count']} PASS, {save['fail_count']} unresolved FAIL; historical result not reproduced")


if __name__ == "__main__":
    main()
