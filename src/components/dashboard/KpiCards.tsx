import React from 'react';
import { DATASET_OVERVIEW } from '../../data/mockDataset';
import { Layers, TrendingUp, Share2, Target } from 'lucide-react';
import { formatNumberVi } from '../../constants/translations';

export const KpiCards: React.FC = () => {
  const kpis = [
    {
      title: 'Tổng số chiến dịch',
      value: formatNumberVi(DATASET_OVERVIEW.totalCampaigns),
      unit: 'chiến dịch',
      subtext: `Quy mô dataset nghiên cứu: ${DATASET_OVERVIEW.timePeriod}`,
      icon: Layers,
      color: 'from-blue-600 to-blue-600',
      lightBg: 'bg-blue-50 text-blue-700',
      borderAccent: 'border-l-4 border-l-blue-600',
    },
    {
      title: 'ROI minh họa trung bình',
      value: DATASET_OVERVIEW.meanRoi.toFixed(4).replace('.', ','),
      unit: 'thang đo dataset',
      subtext: `Biên độ ROI từ ${DATASET_OVERVIEW.minRoi.toFixed(1).replace('.', ',')} đến ${DATASET_OVERVIEW.maxRoi.toFixed(1).replace('.', ',')}`,
      icon: TrendingUp,
      color: 'from-emerald-600 to-teal-600',
      lightBg: 'bg-emerald-50 text-emerald-700',
      borderAccent: 'border-l-4 border-l-emerald-600',
    },
    {
      title: 'Kênh Marketing',
      value: formatNumberVi(DATASET_OVERVIEW.totalChannels),
      unit: 'kênh',
      subtext: 'Google Ads, Facebook, Instagram, YouTube, Email, Website',
      icon: Share2,
      color: 'from-blue-600 to-blue-600',
      lightBg: 'bg-blue-50 text-blue-700',
      borderAccent: 'border-l-4 border-l-blue-600',
    },
    {
      title: 'Loại chiến dịch',
      value: formatNumberVi(DATASET_OVERVIEW.totalCampaignTypes),
      unit: 'loại hình',
      subtext: 'Tìm kiếm, Mạng xã hội, Người ảnh hưởng, Hiển thị, Email',
      icon: Target,
      color: 'from-amber-600 to-orange-600',
      lightBg: 'bg-amber-50 text-amber-700',
      borderAccent: 'border-l-4 border-l-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 ${kpi.borderAccent}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className={`p-2.5 rounded-xl ${kpi.lightBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {kpi.value}
              </span>
              <span className="text-xs font-medium text-slate-500">{kpi.unit}</span>
            </div>

            <p className="mt-2 text-xs text-slate-500 line-clamp-1">
              {kpi.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
