// Read-only snapshot of published reports, not serving research estimators.
export function ResearchEvidence() {
  return <section data-testid="research-evidence" className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 text-sm">
    <h2 className="font-bold text-lg">Nghiên cứu bổ sung Phase 4B — snapshot báo cáo</h2>
    <div className="space-y-2">
      <h3 className="font-semibold">ROI · Phase 4B.2 · giao thức riêng trên Development</h3>
      <p>15 outer fold; không mô hình nào vượt Dummy ổn định. Không thay số lịch sử hoặc pipeline đang triển khai bằng kết quả này.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-xs">
        <caption className="text-left text-slate-600 pb-2">RMSE theo thang đo ROI của dataset, không phải % hoặc lợi nhuận</caption>
        <thead><tr><th>Mô hình</th><th>RMSE Phase 4B.2</th></tr></thead>
        <tbody>{[['Dummy','1,734476'],['Linear Regression','1,734565'],['Decision Tree','1,734714'],['Random Forest','1,734608'],['HistGradientBoosting','1,734682']].map(([name,score])=><tr key={name}><td>{name}</td><td>{score}</td></tr>)}</tbody>
      </table></div>
    </div>
    <div className="space-y-2 border-t pt-4">
      <h3 className="font-semibold">Criteo visit/uplift benchmark · RESEARCH_LIMITED</h3>
      <p>S-Learner C=0.1; Qini final = 0,003087141. Outcome chính: visit, không phải ROI. Policy top20% vượt random20 trong benchmark có điều kiện nhưng chọn cùng tập với response20, gain so với response20 bằng 0.</p>
      <p>Không có cost/revenue để tính ROI; thiếu kiểm chứng ngoài quần thể benchmark. Không ánh xạ feature ẩn danh sang năm dropdown website, không phục vụ model Criteo trong API hiện tại và không chứng minh tối ưu Marketing thực tế.</p>
    </div>
    <p className="text-xs text-slate-600 break-words">Nguồn snapshot: research/phase4b2/model_experiment_report.md; research/final_ml_research_summary.md; research/final_ml_experiment_results.md; research/ml_to_website_handoff.md. Snapshot được đối chiếu khi hoàn thiện Phase 5.2; không tự cập nhật từ API.</p>
  </section>;
}
