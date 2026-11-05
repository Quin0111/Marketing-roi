import React, { useState, useMemo } from 'react';
import { SAMPLE_CAMPAIGNS, CAMPAIGN_TYPES_OPTIONS, CHANNEL_USED_OPTIONS } from '../../data/mockDataset';
import { Search, Filter, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Badge } from '../common/Badge';
import {
  CAMPAIGN_TYPE_LABELS,
  CHANNEL_LABELS,
  TARGET_AUDIENCE_LABELS,
  CUSTOMER_SEGMENT_LABELS,
  formatNumberVi,
} from '../../constants/translations';
import { CampaignType, ChannelUsed } from '../../types';

export const CampaignTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Lọc dữ liệu theo từ khóa và danh mục
  const filteredData = useMemo(() => {
    return SAMPLE_CAMPAIGNS.filter((item) => {
      const typeLabel = CAMPAIGN_TYPE_LABELS[item.campaignType] || item.campaignType;
      const audienceLabel = TARGET_AUDIENCE_LABELS[item.targetAudience] || item.targetAudience;
      const segmentLabel = CUSTOMER_SEGMENT_LABELS[item.customerSegment] || item.customerSegment;
      const channelLabel = CHANNEL_LABELS[item.channelUsed] || item.channelUsed;

      const matchSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerSegment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        segmentLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.targetAudience.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audienceLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.channelUsed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channelLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.campaignType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        typeLabel.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = selectedType === 'all' || item.campaignType === selectedType;
      const matchChannel = selectedChannel === 'all' || item.channelUsed === selectedChannel;

      return matchSearch && matchType && matchChannel;
    });
  }, [searchTerm, selectedType, selectedChannel]);

  // Phân trang
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Thanh điều khiển: Tìm kiếm & Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, phân khúc, kênh..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bộ lọc Loại chiến dịch */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Lọc loại chiến dịch"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả loại chiến dịch</option>
              {CAMPAIGN_TYPES_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {CAMPAIGN_TYPE_LABELS[t as CampaignType] || t}
                </option>
              ))}
            </select>
          </div>

          {/* Bộ lọc Kênh Marketing */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Lọc kênh Marketing"
              value={selectedChannel}
              onChange={(e) => {
                setSelectedChannel(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả kênh Marketing</option>
              {CHANNEL_USED_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABELS[c as ChannelUsed] || c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Mã chiến dịch</th>
              <th className="py-3 px-4">Loại chiến dịch</th>
              <th className="py-3 px-4">Kênh Marketing</th>
              <th className="py-3 px-4">Đối tượng mục tiêu</th>
              <th className="py-3 px-4">Phân khúc khách hàng</th>
              <th className="py-3 px-4 text-center">Thời lượng</th>
              <th className="py-3 px-4 text-right">ROI minh họa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700">
                    {row.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-900">
                      {CAMPAIGN_TYPE_LABELS[row.campaignType] || row.campaignType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="secondary" size="sm">
                      {CHANNEL_LABELS[row.channelUsed] || row.channelUsed}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    {TARGET_AUDIENCE_LABELS[row.targetAudience] || row.targetAudience}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {CUSTOMER_SEGMENT_LABELS[row.customerSegment] || row.customerSegment}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-xs text-slate-600 font-medium">
                      {row.durationDays} ngày
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        row.roi >= 5.0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {row.roi.toFixed(2).replace('.', ',')}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                  Không tìm thấy chiến dịch phù hợp với tiêu chí lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang & Ghi chú */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50/60 px-3 py-1 rounded-lg border border-slate-200/60">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Dữ liệu minh họa: 12 bản ghi hardcode cho giao diện, không phải trích xuất đã xác minh từ dataset. ROI theo thang đo dataset.</span>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Trang <strong className="text-slate-800">{currentPage}</strong> / {totalPages} (Tổng cộng {formatNumberVi(filteredData.length)} kết quả)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600"
              aria-label="Trang tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
