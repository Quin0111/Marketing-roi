import React from 'react';
import { EXPERIMENT_RESULTS } from '../../data/modelResults';
import { ShieldCheck, Info } from 'lucide-react';

export const ModelComparisonTable: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-card">
        <table data-testid="historical-metrics-table" className="w-full min-w-[920px] text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">Tên mô hình</th>
              <th className="py-3.5 px-4">Loại hình</th>
              <th className="py-3.5 px-4 text-right">MAE trung bình</th>
              <th className="py-3.5 px-4 text-right">RMSE trung bình</th>
              <th className="py-3.5 px-4 text-right">R² trung bình</th>
              <th className="py-3.5 px-4 text-center">Số Fold vượt Baseline</th>
              <th className="py-3.5 px-4 text-center">Trạng thái so với mô hình cơ sở</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {EXPERIMENT_RESULTS.map((m) => {
              const isBaseline = m.category === 'Baseline';
              return (
                <tr
                  key={m.id}
                  className={`transition-colors ${
                    isBaseline ? 'bg-blue-50/40 font-medium' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{m.name}</div>
                    <div className="text-[11px] text-slate-500 max-w-xs">{m.description}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        isBaseline
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isBaseline ? 'Mô hình cơ sở' : 'Mô hình học máy'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-slate-800">
                    {m.meanMae.toFixed(6).replace('.', ',')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-slate-800">
                    <span className={isBaseline ? 'text-emerald-700 font-bold underline' : ''}>
                      {m.meanRmse.toFixed(6).replace('.', ',')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-rose-600">
                    {m.meanR2.toFixed(6).replace('.', ',')}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-xs font-semibold">
                    {isBaseline ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Chưa xác minh
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {isBaseline ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-ink" />
                        <span>Mô hình chuẩn (Baseline)</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">
                        
                        <span>RMSE cao hơn baseline</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="text-xs text-slate-500 pt-1"><summary className="cursor-pointer">Chi tiết nguồn bảng</summary><div className="flex gap-2 mt-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          Snapshot lịch sử từ model_metrics.json: 5-Fold trên Development 170.000 dòng theo metadata.
          Thiếu provenance từng fold; RMSE Dummy lịch sử 1,732275 chưa tái lập được trong audit 4B.1A.
          Không dùng Test ROI 30.000 dòng để lựa chọn mô hình.
        </span>
      </div></details>
    </div>
  );
};
