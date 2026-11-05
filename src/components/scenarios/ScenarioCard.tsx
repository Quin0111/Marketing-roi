import React from 'react';
import { MarketingScenario, ScenarioPredictionState } from '../../types';
import { ScenarioPrediction } from './ScenarioPrediction';
import { Edit2, Copy, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import {
  CAMPAIGN_TYPE_LABELS,
  CHANNEL_LABELS,
  TARGET_AUDIENCE_LABELS,
  CUSTOMER_SEGMENT_LABELS,
  DURATION_LABELS,
} from '../../constants/translations';

interface ScenarioCardProps {
  scenario: MarketingScenario;
  onEdit: (scenario: MarketingScenario) => void;
  onDuplicate: (scenario: MarketingScenario) => void;
  onDelete: (id: string) => void;
  prediction: ScenarioPredictionState;
  canPredict: boolean;
  compatibilityIssues?: string[];
  onPredict: () => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onEdit,
  onDuplicate,
  onDelete,
  prediction,
  canPredict,
  compatibilityIssues,
  onPredict,
}) => {
  return (
    <div data-testid={`scenario-card-${scenario.id}`} className="bg-white rounded-xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Tiêu đề kịch bản và các nút thao tác */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-bold text-slate-900 text-sm tracking-tight hover:text-ink transition-colors">
              {scenario.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>Cập nhật: {scenario.updatedAt}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(scenario)}
              title="Chỉnh sửa kịch bản"
              aria-label="Chỉnh sửa kịch bản"
              className="p-1.5 rounded-lg text-slate-400 hover:text-ink hover:bg-blue-50 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDuplicate(scenario)}
              title="Nhân bản kịch bản"
              aria-label="Nhân bản kịch bản"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(scenario.id)}
              title="Xóa kịch bản"
              aria-label="Xóa kịch bản"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Các thẻ thuộc tính cấu hình */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Kênh Marketing</span>
            <span className="font-semibold text-slate-800">
              {CHANNEL_LABELS[scenario.features.channelUsed] || scenario.features.channelUsed}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Loại chiến dịch</span>
            <span className="font-semibold text-slate-800">
              {CAMPAIGN_TYPE_LABELS[scenario.features.campaignType] || scenario.features.campaignType}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Đối tượng mục tiêu</span>
            <span className="font-semibold text-slate-800 truncate block">
              {TARGET_AUDIENCE_LABELS[scenario.features.targetAudience] || scenario.features.targetAudience}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Thời lượng</span>
            <span className="font-semibold text-slate-800">
              {DURATION_LABELS[scenario.features.durationDays] || `${scenario.features.durationDays} ngày`}
            </span>
          </div>
        </div>

        <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100 text-xs">
          <span className="text-[10px] text-slate-400 block">Phân khúc khách hàng:</span>
          <span className="font-medium text-slate-700">
            {CUSTOMER_SEGMENT_LABELS[scenario.features.customerSegment] || scenario.features.customerSegment}
          </span>
        </div>

        {scenario.notes && (
          <p className="text-xs text-slate-500 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100 line-clamp-2">
            "{scenario.notes}"
          </p>
        )}
      </div>

      {/* Chỉ số mô phỏng chân thẻ */}
      <div className="p-5 bg-slate-50/90 border-t border-slate-100 space-y-3 text-xs">
        <ScenarioPrediction state={prediction} />
        {!!compatibilityIssues?.length&&<ul className="list-disc pl-4 text-slate-600">{compatibilityIssues.map(v=><li key={v}>{v}</li>)}</ul>}
        <button type="button" onClick={onPredict} disabled={!canPredict || prediction.status === 'loading'} className="w-full px-3 py-2 bg-blue-600 text-slate-800 rounded-lg font-semibold disabled:opacity-50">
          {prediction.status === 'loading' ? 'Đang dự đoán…' : prediction.status === 'error' ? 'Thử lại dự đoán' : prediction.status === 'success' ? 'Dự đoán lại ROI' : 'Dự đoán ROI kịch bản'}
        </button>
        {prediction.status === 'idle' && scenario.predictedRoi !== undefined && <div data-source="DEMO_DATA" className="flex flex-wrap justify-between gap-2 border-t pt-2">
        <div className="flex items-center gap-1.5 text-slate-600">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-medium text-slate-500">ROI mô phỏng (dữ liệu minh họa) · DEMO_DATA:</span>
        </div>
        <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
          {scenario.predictedRoi === undefined ? 'Chưa có' : `~${scenario.predictedRoi.toFixed(4).replace('.', ',')}`}
        </span>
        </div>}
      </div>
    </div>
  );
};
