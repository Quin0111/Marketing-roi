import { PredictionResponse } from '../../types';
import { CAMPAIGN_TYPE_LABELS, CHANNEL_LABELS, TARGET_AUDIENCE_LABELS, CUSTOMER_SEGMENT_LABELS } from '../../constants/translations';
export function PredictionResultCard({ result, isLoading, onAddToComparison }: {
 result: PredictionResponse | null; isLoading: boolean; onAddToComparison?: (result: PredictionResponse) => void;
}) {
 if (isLoading) return <div role="status" className="bg-white border rounded-xl p-8 min-h-64 text-center text-slate-600">Đang dự đoán ROI… Đang chờ kết quả từ mô hình trên máy chủ.</div>;
 if (!result) return <div className="bg-white border border-dashed rounded-xl p-8 min-h-64 text-center text-slate-500"><h3 className="font-semibold">Chưa có kết quả dự đoán</h3><p className="text-sm mt-2">Chọn 5 thông số và nhấn Dự đoán ROI.</p></div>;
 const f = result.campaignSummary;
 return <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-5" data-source="MODEL_PREDICTION">
 <div><h2 className="font-semibold">Kết quả dự đoán ROI</h2><p className="text-xs text-slate-500 mt-1">Đã dự đoán bằng mô hình · API /predict</p><strong data-testid="predicted-roi" data-value={result.predictedRoi} className="block text-3xl font-semibold text-ink mt-4">{result.predictedRoi.toFixed(4).replace('.', ',')}</strong><p className="text-xs text-slate-500 mt-2">Thang đo nghiên cứu, không phải % hoặc lợi nhuận.</p></div>
 <div className="text-sm bg-beige rounded-lg p-4"><p className="font-semibold">{result.modelUsed}</p><p>Phiên bản mô hình: {result.modelVersion}</p><p className="text-xs text-slate-600 mt-1">{result.qualityStatus} · Chỉ phục vụ nghiên cứu, chưa đủ cơ sở khuyến nghị.</p></div>
 <dl className="grid grid-cols-2 gap-3 text-sm">{Object.entries({ 'Loại chiến dịch': CAMPAIGN_TYPE_LABELS[f.campaignType], 'Kênh Marketing': CHANNEL_LABELS[f.channelUsed], 'Đối tượng mục tiêu': TARGET_AUDIENCE_LABELS[f.targetAudience], 'Phân khúc khách hàng': CUSTOMER_SEGMENT_LABELS[f.customerSegment], 'Thời lượng': `${f.durationDays} ngày` }).map(([label,value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl>
 <details className="text-xs text-slate-600 border-t pt-3"><summary className="cursor-pointer font-semibold">Nguồn và giới hạn kết quả</summary><p className="mt-3">{result.warningNotice}</p><p className="mt-2">Thời điểm tính toán: {result.computationTimestamp}</p><p>Giá trị API đầy đủ: <span data-testid="raw-predicted-roi">{result.predictedRoi}</span>. Chỉ làm tròn khi hiển thị.</p></details>
 {onAddToComparison && <button type="button" onClick={() => onAddToComparison(result)} className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-200 text-slate-800 text-sm font-semibold">Lưu thành kịch bản so sánh</button>}
 </section>;
}
