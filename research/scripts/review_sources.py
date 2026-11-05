"""Read-only source review and comparison with preserved historical metrics."""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "research/.deps"))
import pandas as pd
from pypdf import PdfReader


def main():
    out = ROOT / "research/outputs/phase4b1"
    results = json.loads((out / "audit_results.json").read_text(encoding="utf-8"))
    old = json.loads((ROOT / "backend/models/model_metrics.json").read_text(encoding="utf-8"))
    rows = []
    for new, original in [("Dummy_mean", "Dummy Regressor"), ("Fresh_linear_current5", "Linear Regression")]:
        current = next(row for row in results["diagnostic_cv"] if row["model"] == new)
        rows.append({"model": original, "published_RMSE_mean_unchanged": old["results"][original]["RMSE_mean"],
            "new_diagnostic_RMSE_mean": current["RMSE_mean"],
            "difference": current["RMSE_mean"] - old["results"][original]["RMSE_mean"],
            "historical_fold_provenance_available": False})
    pd.DataFrame(rows).to_csv(out / "historical_metrics_comparison.csv", index=False)
    notebook_path = next(Path(path) for path in results["sources_sha256"] if path.endswith(".ipynb"))
    notebook = json.loads(notebook_path.read_text(encoding="utf-8"))
    metadata = {}
    for index in [62, 80, 84, 86, 104, 117, 147]:
        cell = notebook["cells"][index]
        metadata[str(index)] = {"execution_count": cell.get("execution_count"),
            "output_blocks": len(cell.get("outputs", [])), "source": "".join(cell.get("source", []))}
    pdfs = []
    for path in ROOT.parent.glob("*.pdf"):
        if "ROI" not in path.name and "DreamMakers" not in path.name:
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        reader = PdfReader(path)
        selected = [0, 1, 2, 3, 5, 6, 12] if "ROI" in path.name else [22, 23]
        snippets = [{"page_one_based": index + 1, "text": reader.pages[index].extract_text() or ""}
                    for index in selected if index < len(reader.pages)]
        assert hashlib.sha256(path.read_bytes()).hexdigest() == digest
        pdfs.append({"path": str(path), "sha256": digest, "pages": len(reader.pages), "relevant_extracts": snippets})
    (out / "source_review.json").write_text(json.dumps({"notebook_historical_execution_evidence": metadata,
        "local_pdf_sources": pdfs}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Source review and historical comparison written without modifying originals")


if __name__ == "__main__":
    main()
