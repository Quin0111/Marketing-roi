import React from 'react';
import { ShieldCheck, Award, AlertTriangle, Layers } from 'lucide-react';

export const PerformanceOverview: React.FC = () => {
  const cards = [
    {
      title: 'Mô hình cơ sở (Baseline)',
      value: 'Dummy Regressor',
      subtext: 'Dummy mean được fit trên phần huấn luyện của từng lần đánh giá',
      icon: Award,
      color: 'border-l-4 border-l-blue-600',
      badge: 'Mô hình chuẩn',
      badgeClass: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'RMSE thấp nhất trong snapshot lịch sử',
      value: '1,732275',
      subtext: 'Thuộc về mô hình cơ sở Dummy Regressor',
      icon: ShieldCheck,
      color: 'border-l-4 border-l-emerald-600',
      badge: 'Mức sai số tối thiểu',
      badgeClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Số mô hình ML vượt mô hình cơ sở',
      value: '0 / 3',
      subtext: 'Cả 3 mô hình học máy đều chưa vượt Baseline',
      icon: AlertTriangle,
      color: 'border-l-4 border-l-amber-600',
      badge: 'Chưa vượt baseline',
      badgeClass: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Bằng chứng từng Fold lịch sử',
      value: 'Chưa xác minh',
      subtext: 'Thiếu indices và metric từng fold; không suy ra từ mean RMSE',
      icon: Layers,
      color: 'border-l-4 border-l-rose-600',
      badge: 'Thiếu provenance',
      badgeClass: 'bg-rose-50 text-rose-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className={`bg-white rounded-xl p-5 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all ${c.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {c.title}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badgeClass}`}>
                {c.badge}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {c.value}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span className="line-clamp-1">{c.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
