import { ScenarioPredictionState } from '../../types';

export function ScenarioPrediction({ state }: { state: ScenarioPredictionState }) {
  if (state.status === 'loading') return <p data-source="NOT_PREDICTED" role="status" className="text-blue-700">Đang dự đoán bằng Backend…</p>;
  if (state.status === 'error') return <div data-source="NOT_PREDICTED" className="space-y-1">
    <p className="font-semibold text-rose-800">Dự đoán thất bại</p>
    <p role="alert" className="text-rose-700">{state.message}</p>
    <p className="text-slate-500">Không có ROI từ API; không dùng dữ liệu minh họa thay thế.</p>
  </div>;
  if (state.status !== 'success') return <p data-source="NOT_PREDICTED" className="text-slate-500">Chưa dự đoán · chưa có kết quả từ Backend.</p>;
  const result = state.result;
  return <div className="space-y-2 break-words" data-testid="scenario-api-result" data-source="MODEL_PREDICTION">
    <p className="font-semibold text-blue-800">Đã dự đoán bằng mô hình</p>
    <p>ROI dự đoán: <strong data-testid="scenario-api-roi" data-value={result.predictedRoi} className="font-mono break-all">{result.predictedRoi.toFixed(4).replace('.', ',')}</strong></p>
    <p>Nguồn: API /predict · thang đo dataset, đơn vị kinh tế chưa xác minh.</p>
    <p>{result.modelUsed} · phiên bản {result.modelVersion} · <strong>{result.qualityStatus}</strong></p>
    <details className="text-slate-600"><summary className="cursor-pointer">Cảnh báo nghiên cứu</summary><p className="mt-2" data-testid="scenario-api-warning">{result.warningNotice}</p></details>
    <p className="text-slate-500">Thời điểm dự đoán: {result.computationTimestamp}. Chỉ phục vụ nghiên cứu, không phải kiểm chứng độ chính xác.</p>
  </div>;
}
