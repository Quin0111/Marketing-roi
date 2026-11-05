import React, { useState, useMemo } from 'react';
import { MarketingScenario, ScenarioPredictionState } from '../../types';
import { ArrowUpDown, BarChart3, Info } from 'lucide-react';
import { ScenarioPrediction } from './ScenarioPrediction';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import {
  CAMPAIGN_TYPE_LABELS,
  CHANNEL_LABELS,
  TARGET_AUDIENCE_LABELS,
  CUSTOMER_SEGMENT_LABELS,
} from '../../constants/translations';

interface ScenarioComparisonTableProps {
  scenarios: MarketingScenario[];
  afterChart?: React.ReactNode;
  predictionFor?: (scenario: MarketingScenario) => ScenarioPredictionState;
}

type SortField = 'name' | 'duration';

export const ScenarioComparisonTable: React.FC<ScenarioComparisonTableProps> = ({ scenarios, afterChart, predictionFor = () => ({ status: 'idle' }) }) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showChart, setShowChart] = useState(true);
  const [source, setSource] = useState<'api' | 'demo'>('api');
  const sourceLabel = source === 'api' ? 'ROI dự đoán · API /predict' : 'ROI mô phỏng · dữ liệu minh họa';

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedScenarios = useMemo(() => {
    return [...scenarios].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'duration') {
        comparison = a.features.durationDays - b.features.durationDays;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [scenarios, sortField, sortOrder]);

  const chartData = sortedScenarios.flatMap(sc => {
    const prediction = predictionFor(sc);
    const roi = source === 'api'
      ? prediction.status === 'success' ? prediction.result.predictedRoi : undefined
      : sc.predictedRoi;
    return roi === undefined ? [] : [{ id: sc.id, name: sc.name, roi }];
  });

  const barColors = ['#B8CCD7', '#B8CCD7', '#91ADBD', '#60717A', '#607E8F', '#DDE7ED'];

  return (
    <div className="space-y-6">
      {/* Khối biểu đồ đối chiếu */}
      {scenarios.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-ink" />
              <h4 className="font-bold text-slate-800 text-sm">
                Biểu đồ đối chiếu ROI có nguồn
              </h4>
            </div>
            <button
              onClick={() => setShowChart(!showChart)}
              className="text-xs text-ink font-semibold hover:underline cursor-pointer"
            >
              {showChart ? 'Thu gọn biểu đồ' : 'Mở rộng biểu đồ'}
            </button>
          </div>

          <label className="text-xs font-semibold flex flex-wrap items-center gap-2">
            Nguồn biểu đồ
            <select value={source} onChange={event => setSource(event.target.value as 'api' | 'demo')} className="border rounded-lg p-2 bg-white">
              <option value="api">ROI dự đoán từ API /predict</option>
              <option value="demo">ROI mô phỏng (dữ liệu minh họa)</option>
            </select>
          </label>
          <p className="text-xs text-slate-600" data-testid="comparison-chart-source" data-source={source === 'api' ? 'MODEL_PREDICTION' : 'DEMO_DATA'}>{sourceLabel}. Chỉ hiển thị các kịch bản có dữ liệu từ nguồn đã chọn; không trộn hai nguồn.</p>
          <ul className="flex flex-wrap gap-2 text-xs" data-testid="comparison-chart-values">
            {chartData.map(row => <li key={row.id} data-scenario-id={row.id} data-value={row.roi} className="bg-slate-50 rounded p-2">{row.name}: {row.roi.toFixed(4).replace('.', ',')}</li>)}
          </ul>

          {showChart && (chartData.length ? (
            <div className="w-full h-64 pt-2" data-testid="comparison-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EE" vertical={false} />
                  <XAxis dataKey="name" stroke="#60717A" fontSize={11} tickLine={false} />
                  <YAxis
                    domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(1, max)]}
                    stroke="#667780"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => val.toFixed(2).replace('.', ',')}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#485760',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(val: any) => [String(val).replace('.', ','), `${sourceLabel} · thang đo dataset`]}
                    labelFormatter={(label) => `Kịch bản: ${label}`}
                  />
                  <Bar isAnimationActive={false} dataKey="roi" radius={[6, 6, 0, 0]} barSize={36} name={sourceLabel}>
                    {chartData.map((_, idx) => (
                      <Cell key={`bar-${idx}`} fill={barColors[idx % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-slate-500 p-4" data-testid="comparison-chart-empty">{source === 'api' ? 'Chưa có kết quả API hợp lệ để vẽ biểu đồ. Không dùng ROI mô phỏng thay thế khi chưa dự đoán hoặc API lỗi.' : 'Chưa có dữ liệu minh họa từ các kịch bản hiện tại.'}</p>)}
          <p className="text-xs text-slate-600">BASELINE_ONLY: Không xếp hạng hoặc chọn kịch bản tốt nhất. Chênh lệch dự đoán không chứng minh tác động hay hiệu quả kinh doanh thực tế.</p>
        </div>
      )}

      {afterChart}
      {/* Bảng so sánh các kịch bản */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-card">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <th
                onClick={() => handleSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:text-ink transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tên kịch bản</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3.5 px-4">Loại chiến dịch</th>
              <th className="py-3.5 px-4">Kênh Marketing</th>
              <th className="py-3.5 px-4">Đối tượng mục tiêu</th>
              <th className="py-3.5 px-4">Phân khúc khách hàng</th>
              <th
                onClick={() => handleSort('duration')}
                className="py-3.5 px-4 cursor-pointer hover:text-ink transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Thời lượng</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span>ROI mô phỏng</span>
                </div>
              </th>
              <th className="py-3.5 px-4 text-left min-w-64">ROI dự đoán · API /predict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedScenarios.map((sc) => (
              <tr key={sc.id} data-testid={`scenario-row-${sc.id}`} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  {sc.name}
                </td>
                <td className="py-3.5 px-4 text-slate-700">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-medium">
                    {CAMPAIGN_TYPE_LABELS[sc.features.campaignType] || sc.features.campaignType}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-800">
                  {CHANNEL_LABELS[sc.features.channelUsed] || sc.features.channelUsed}
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-600">
                  {TARGET_AUDIENCE_LABELS[sc.features.targetAudience] || sc.features.targetAudience}
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-600">
                  {CUSTOMER_SEGMENT_LABELS[sc.features.customerSegment] || sc.features.customerSegment}
                </td>
                <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                  {sc.features.durationDays} ngày
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="font-bold text-slate-900 font-mono">
                    {sc.predictedRoi === undefined ? 'Chưa có điểm minh họa' : `~${sc.predictedRoi.toFixed(4).replace('.', ',')}`}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-left text-xs">
                  <ScenarioPrediction state={predictionFor(sc)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ghi chú tuân thủ chuẩn mực */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Tiêu chuẩn đối chiếu kịch bản:</strong> Bảng tách riêng ROI mô phỏng và kết quả API; biểu đồ chỉ dùng nguồn đã chọn. Chỉ có thể đối chiếu đầu ra nghiên cứu, không tự ý xếp hạng hoặc tuyên bố chiến dịch tối ưu khi mô hình ở trạng thái <strong>BASELINE_ONLY</strong>.
        </p>
      </div>
    </div>
  );
};
