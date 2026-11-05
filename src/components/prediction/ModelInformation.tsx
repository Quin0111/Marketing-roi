import { useEffect, useRef, useState } from 'react';
import { useModel } from '../../contexts/ModelContext';
import { EXPERIMENT_RESULTS } from '../../data/modelResults';
import { ModelInsightsPage } from '../../pages/ModelInsightsPage';

export function ModelInformation({ revealRequest }: { revealRequest?: number }) {
  const { info } = useModel();
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const section = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  useEffect(() => {
    if (revealRequest === undefined) return;
    setOpen(true);
    const frame = requestAnimationFrame(() => {
      summary.current?.focus({ preventScroll: true });
      section.current?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [revealRequest]);
  const linear = EXPERIMENT_RESULTS.find(row => row.id === 'linear-regression')!;
  const dummy = EXPERIMENT_RESULTS.find(row => row.id === 'dummy')!;
  return <details ref={section} id="model-info" open={open} onToggle={event => setOpen(event.currentTarget.open)}
    className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-600 scroll-mt-24" data-testid="model-information">
    <summary ref={summary} className="cursor-pointer font-semibold text-slate-900">Thông tin mô hình</summary>
    <div className="mt-4 space-y-4">
      <p><strong className="text-slate-900">Linear Regression</strong> · {info ? `Metadata API: phiên bản ${info.model_version} · Quality Gate = ${info.quality_status}` : 'Chưa xác minh được metadata API; cấu hình triển khai dự kiến BASELINE_ONLY.'}</p>
      <dl className="grid grid-cols-3 gap-3" data-testid="model-summary-metrics">
        {([['MAE', linear.meanMae], ['RMSE', linear.meanRmse], ['R²', linear.meanR2]] as const).map(([label,value]) => <div key={label} className="rounded-lg bg-slate-50 border p-3 min-w-0"><dt className="text-xs">{label}</dt><dd className="font-semibold text-slate-900 break-all" data-value={value}>{value.toFixed(6).replace('.', ',')}</dd></div>)}
      </dl>
      <p className="text-xs" data-testid="model-summary-source">Nguồn: model_metrics.json · artifact 1.0.0 · snapshot lịch sử 5-Fold trên Development 170.000 dòng theo metadata. Dummy RMSE {dummy.meanRmse.toFixed(6).replace('.', ',')}; kết quả lịch sử còn giới hạn tái lập theo audit 4B.1A. Các số này không phải metrics động từ API.</p>
      <p data-testid="model-warning">{info?.warning ?? 'Chưa xác minh được trạng thái mô hình từ Backend. Không đưa ra khuyến nghị tối ưu.'}</p>
      <p className="text-xs">ROI trên thang đo nghiên cứu, không phải % hoặc lợi nhuận. Chưa vượt Dummy ổn định; chưa có khoảng dự đoán được hiệu chuẩn. RMSE không phải khoảng tin cậy.</p>
      <details open={historyOpen} onToggle={event => setHistoryOpen(event.currentTarget.open)} className="border-t pt-3">
        <summary className="cursor-pointer font-semibold text-slate-900">Bảng đánh giá và nghiên cứu chi tiết</summary>
        {historyOpen && <div className="mt-4"><ModelInsightsPage /></div>}
      </details>
    </div>
  </details>;
}
