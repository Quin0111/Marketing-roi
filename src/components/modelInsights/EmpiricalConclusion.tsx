export function EmpiricalConclusion() {
  return <section className="bg-white text-slate-700 rounded-xl p-6 space-y-4 text-sm">
    <h3 className="font-bold text-lg">Kết luận và giới hạn nghiên cứu ROI</h3>
    <p>Các mô hình ROI chưa vượt Dummy ổn định. Chỉ sử dụng kết quả suy luận để minh họa nghiên cứu; không chọn chiến dịch, kênh hoặc ngân sách tối ưu.</p>
    <p>Audit Phase 4B.1 ghi nhận ROI gần đều và tín hiệu từ năm feature rất yếu. Nguồn sinh dữ liệu và công thức kinh tế ROI chưa được xác minh đầy đủ. Giả thuyết dữ liệu tổng hợp hoặc mô hình học nhiễu không phải kết luận nguyên nhân đã được chứng minh.</p>
    <p>Date có chu kỳ trùng Campaign_ID; không dùng Date làm feature trước khi xác minh timing. Duration_days là biến số; bốn feature còn lại là phân loại.</p>
    <p>Trước khi nghiên cứu khuyến nghị thực tế cần dữ liệu có quyền sử dụng, feature biết trước can thiệp, chi phí/doanh thu được kiểm toán và đánh giá chính sách trên thử nghiệm độc lập. Kết quả tương quan hoặc điểm dự báo không chứng minh tác động nhân quả.</p>
    <p className="text-xs text-slate-500">Nguồn: research/phase4b1_data_audit.md; research/phase4b1a_reproducibility_audit.md; research/ml_to_website_handoff.md.</p>
  </section>;
}
