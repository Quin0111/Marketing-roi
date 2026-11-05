import React from 'react';
import { DATASET_OVERVIEW } from '../../data/mockDataset';
import { Info, Database, Calendar, ShieldCheck, FileText } from 'lucide-react';
import { formatNumberVi } from '../../constants/translations';

export const DatasetInfoCard: React.FC = () => {
  return (
    <div className="bg-white text-slate-900 rounded-xl p-6 shadow-xl border border-slate-200 relative overflow-hidden">
      {/* Hiệu ứng nền đồ họa */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-20 bottom-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2.5 text-blue-400">
          <Info className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Dataset nghiên cứu & dữ liệu giao diện minh họa</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 ">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-1">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Quy mô dữ liệu</span>
            </div>
            <div className="text-lg font-bold text-white">{formatNumberVi(DATASET_OVERVIEW.totalCampaigns)} Chiến dịch</div>
            <p className="text-xs text-slate-400 mt-1">{DATASET_OVERVIEW.totalFeatures} thuộc tính gốc với đầy đủ các kênh truyền thông số.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 ">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-1">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Mốc thời gian trong hồ sơ</span>
            </div>
            <div className="text-lg font-bold text-white">{DATASET_OVERVIEW.timePeriod}</div>
            <p className="text-xs text-slate-400 mt-1">Trường Date có chu kỳ trùng Campaign_ID; không dùng làm bằng chứng về thời gian thu thập thực tế.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 ">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Chuẩn mực học thuật</span>
            </div>
            <div className="text-lg font-bold text-white">Chế độ minh họa</div>
            <p className="text-xs text-slate-400 mt-1">Minh bạch hóa số liệu, không ngụy tạo kết quả dự báo thực tế.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
          <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300">Ghi chú tính khoa học bắt buộc:</strong> {DATASET_OVERVIEW.researchLimitNotice}
          </div>
        </div>
      </div>
    </div>
  );
};
