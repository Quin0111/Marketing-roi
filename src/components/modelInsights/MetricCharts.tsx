import React from 'react';
import { EXPERIMENT_RESULTS } from '../../data/modelResults';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

export const MetricCharts: React.FC = () => {
  const chartData = EXPERIMENT_RESULTS.map((m) => {
    let displayName = 'Mô hình cơ sở';
    if (m.id === 'dummy') displayName = 'Dummy (Cơ sở)';
    else if (m.id === 'linear-regression') displayName = 'Hồi quy tuyến tính';
    else if (m.id === 'decision-tree') displayName = 'Cây quyết định';
    else if (m.id === 'random-forest') displayName = 'Rừng ngẫu nhiên';

    return {
      name: displayName,
      fullName: m.name,
      mae: m.meanMae,
      rmse: m.meanRmse,
      r2: m.meanR2,
      isBaseline: m.category === 'Baseline',
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Biểu đồ so sánh MAE */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-slate-800 text-sm">So sánh MAE trung bình</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">Thấp hơn là tốt hơn</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Sai số tuyệt đối trung bình giữa giá trị ROI dự đoán và thực tế.</p>
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EE" vertical={false} />
              <XAxis dataKey="name" stroke="#60717A" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
              <YAxis domain={[1.5005, 1.5025]} stroke="#667780" fontSize={10} tickLine={false} tickFormatter={(v) => v.toFixed(4).replace('.', ',')} />
              <Tooltip
                contentStyle={{ backgroundColor: '#485760', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                formatter={(v: any) => [`${Number(v).toFixed(6).replace('.', ',')}`, 'MAE trung bình']}
                labelFormatter={(label) => `Mô hình: ${label}`}
              />
              <Bar dataKey="mae" radius={[4, 4, 0, 0]} name="MAE trung bình">
                {chartData.map((entry, index) => (
                  <Cell key={`mae-${index}`} fill={entry.isBaseline ? '#EBDDD2' : '#B8CCD7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Baseline MAE: <strong>1,500843</strong></span>
          <span className="text-emerald-700 font-semibold">Tốt nhất (Màu xanh lá)</span>
        </div>
      </div>

      {/* 2. Biểu đồ so sánh RMSE */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-slate-800 text-sm">So sánh RMSE trung bình</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Tiêu chí then chốt</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Căn bậc hai của sai số bình phương trung bình (phạt nặng sai lệch lớn).</p>
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EE" vertical={false} />
              <XAxis dataKey="name" stroke="#60717A" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
              <YAxis domain={[1.7320, 1.7345]} stroke="#667780" fontSize={10} tickLine={false} tickFormatter={(v) => v.toFixed(4).replace('.', ',')} />
              <Tooltip
                contentStyle={{ backgroundColor: '#485760', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                formatter={(v: any) => [`${Number(v).toFixed(6).replace('.', ',')}`, 'RMSE trung bình']}
                labelFormatter={(label) => `Mô hình: ${label}`}
              />
              <Bar dataKey="rmse" radius={[4, 4, 0, 0]} name="RMSE trung bình">
                {chartData.map((entry, index) => (
                  <Cell key={`rmse-${index}`} fill={entry.isBaseline ? '#EBDDD2' : '#B8CCD7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Baseline RMSE: <strong>1,732275</strong></span>
          <span className="text-rose-600 font-semibold">Rừng ngẫu nhiên tăng sai số (+0,002)</span>
        </div>
      </div>

      {/* 3. Biểu đồ so sánh R² */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-slate-800 text-sm">So sánh hệ số xác định R²</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700">Giá trị âm</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Mô hình không giải thích được phương sai của biến mục tiêu ROI.</p>
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EE" vertical={false} />
              <XAxis dataKey="name" stroke="#60717A" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
              <YAxis domain={[-0.0026, 0.0001]} stroke="#667780" fontSize={10} tickLine={false} tickFormatter={(v) => v.toFixed(4).replace('.', ',')} />
              <Tooltip
                contentStyle={{ backgroundColor: '#485760', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                formatter={(v: any) => [`${Number(v).toFixed(6).replace('.', ',')}`, 'R² trung bình']}
                labelFormatter={(label) => `Mô hình: ${label}`}
              />
              <Bar dataKey="r2" radius={[0, 0, 4, 4]} name="R² trung bình">
                {chartData.map((_, index) => (
                  <Cell key={`r2-${index}`} fill="#667780" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>R² tiệm cận 0 và âm</span>
          <span className="text-slate-600 font-semibold">Kém hơn dự đoán trung bình</span>
        </div>
      </div>
    </div>
  );
};
