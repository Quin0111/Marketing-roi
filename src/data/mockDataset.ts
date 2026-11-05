import { CampaignRecord, CampaignType, ChannelUsed, CustomerSegment, DurationDays, TargetAudience } from '../types';

export const DATASET_OVERVIEW = {
  totalCampaigns: 200000,
  totalFeatures: 16,
  timePeriod: 'Năm 2021',
  meanRoi: 5.0024,
  minRoi: 2.0,
  maxRoi: 8.0,
  totalChannels: 6,
  totalCampaignTypes: 5,
  source: 'Bộ dữ liệu nghiên cứu Marketing Campaign Performance 2021 (200.000 chiến dịch)',
  isIllustrative: true,
  researchLimitNotice: 'Nguồn quy mô dataset: hồ sơ nghiên cứu Marketing Campaign Performance 2021. Các KPI ROI, bucket biểu đồ và 12 chiến dịch mẫu được hardcode trong src/data/mockDataset.ts để minh họa giao diện; không có quy trình trích xuất được xác minh cho các số minh họa này. ROI giữ trên thang đo dataset, đơn vị kinh tế chưa xác minh. Không dùng biểu đồ để chọn kênh hoặc suy luận hiệu quả kinh doanh.'
};

// Dữ liệu phân phối ROI (Histogram) dựa trên khoảng 2.0 - 8.0 với tâm ở ~5.00
export const ROI_DISTRIBUTION = [
  { range: '2.0 - 2.5', count: 8350, percentage: 4.18 },
  { range: '2.5 - 3.0', count: 16820, percentage: 8.41 },
  { range: '3.0 - 3.5', count: 24700, percentage: 12.35 },
  { range: '3.5 - 4.0', count: 28400, percentage: 14.20 },
  { range: '4.0 - 4.5', count: 29800, percentage: 14.90 },
  { range: '4.5 - 5.0', count: 31200, percentage: 15.60 },
  { range: '5.0 - 5.5', count: 29650, percentage: 14.83 },
  { range: '5.5 - 6.0', count: 18450, percentage: 9.23 },
  { range: '6.0 - 6.5', count: 8210, percentage: 4.11 },
  { range: '6.5 - 7.0', count: 3120, percentage: 1.56 },
  { range: '7.0 - 7.5', count: 980, percentage: 0.49 },
  { range: '7.5 - 8.0', count: 320, percentage: 0.16 },
];

// ROI trung bình theo kênh Marketing (6 kênh)
export const CHANNEL_ROI_DATA = [
  { channel: 'Google Ads', meanRoi: 5.021, campaignsCount: 33450, color: '#3b82f6' },
  { channel: 'Facebook', meanRoi: 5.012, campaignsCount: 33280, color: '#1d4ed8' },
  { channel: 'Instagram', meanRoi: 5.006, campaignsCount: 33310, color: '#e1306c' },
  { channel: 'YouTube', meanRoi: 5.001, campaignsCount: 33220, color: '#ef4444' },
  { channel: 'Email', meanRoi: 4.992, campaignsCount: 33410, color: '#10b981' },
  { channel: 'Website', meanRoi: 4.982, campaignsCount: 33330, color: '#8b5cf6' },
];

// ROI trung bình theo loại chiến dịch (5 loại)
export const CAMPAIGN_TYPE_ROI_DATA = [
  { type: 'Search', meanRoi: 5.018, count: 40150, color: '#6366f1' },
  { type: 'Social Media', meanRoi: 5.012, count: 39980, color: '#06b6d4' },
  { type: 'Influencer', meanRoi: 5.004, count: 40020, color: '#ec4899' },
  { type: 'Display', meanRoi: 4.995, count: 39890, color: '#f59e0b' },
  { type: 'Email', meanRoi: 4.983, count: 39960, color: '#10b981' },
];

// ROI trung bình theo thời lượng chiến dịch (15, 30, 45, 60 ngày)
export const DURATION_ROI_DATA = [
  { duration: '15 ngày', durationDays: 15, meanRoi: 5.008, campaignsCount: 50120, min: 2.02, max: 7.98 },
  { duration: '30 ngày', durationDays: 30, meanRoi: 5.004, campaignsCount: 49880, min: 2.01, max: 7.99 },
  { duration: '45 ngày', durationDays: 45, meanRoi: 4.998, campaignsCount: 50030, min: 2.04, max: 7.95 },
  { duration: '60 ngày', durationDays: 60, meanRoi: 5.000, campaignsCount: 49970, min: 2.00, max: 8.00 },
];

// Danh sách chiến dịch mẫu minh họa cho Bảng dữ liệu chiến dịch (CampaignTable)
export const SAMPLE_CAMPAIGNS: CampaignRecord[] = [
  {
    id: 'CMP-2021-001',
    campaignType: 'Social Media',
    channelUsed: 'Facebook',
    targetAudience: 'Women 25-34',
    customerSegment: 'Fashionistas',
    durationDays: 30,
    roi: 5.42,
    acquisitionCost: 1250,
    conversionRate: 3.8,
    clicks: 14200,
    impressions: 285000,
  },
  {
    id: 'CMP-2021-002',
    campaignType: 'Search',
    channelUsed: 'Google Ads',
    targetAudience: 'Men 25-34',
    customerSegment: 'Tech Enthusiasts',
    durationDays: 45,
    roi: 6.18,
    acquisitionCost: 2100,
    conversionRate: 4.5,
    clicks: 19800,
    impressions: 340000,
  },
  {
    id: 'CMP-2021-003',
    campaignType: 'Influencer',
    channelUsed: 'Instagram',
    targetAudience: 'Women 25-34',
    customerSegment: 'Health & Wellness',
    durationDays: 15,
    roi: 4.85,
    acquisitionCost: 950,
    conversionRate: 2.9,
    clicks: 8700,
    impressions: 190000,
  },
  {
    id: 'CMP-2021-004',
    campaignType: 'Email',
    channelUsed: 'Email',
    targetAudience: 'All Ages',
    customerSegment: 'Foodies',
    durationDays: 15,
    roi: 3.75,
    acquisitionCost: 450,
    conversionRate: 2.1,
    clicks: 5400,
    impressions: 98000,
  },
  {
    id: 'CMP-2021-005',
    campaignType: 'Display',
    channelUsed: 'Website',
    targetAudience: 'Men 18-24',
    customerSegment: 'Outdoor Adventurers',
    durationDays: 60,
    roi: 4.20,
    acquisitionCost: 1800,
    conversionRate: 2.7,
    clicks: 12300,
    impressions: 410000,
  },
  {
    id: 'CMP-2021-006',
    campaignType: 'Social Media',
    channelUsed: 'YouTube',
    targetAudience: 'Men 25-34',
    customerSegment: 'Tech Enthusiasts',
    durationDays: 30,
    roi: 5.80,
    acquisitionCost: 3200,
    conversionRate: 4.1,
    clicks: 22100,
    impressions: 512000,
  },
  {
    id: 'CMP-2021-007',
    campaignType: 'Search',
    channelUsed: 'Google Ads',
    targetAudience: 'Women 35-44',
    customerSegment: 'Foodies',
    durationDays: 30,
    roi: 5.15,
    acquisitionCost: 1450,
    conversionRate: 3.4,
    clicks: 13500,
    impressions: 270000,
  },
  {
    id: 'CMP-2021-008',
    campaignType: 'Influencer',
    channelUsed: 'Instagram',
    targetAudience: 'Men 18-24',
    customerSegment: 'Fashionistas',
    durationDays: 15,
    roi: 4.60,
    acquisitionCost: 1100,
    conversionRate: 3.1,
    clicks: 9800,
    impressions: 215000,
  },
  {
    id: 'CMP-2021-009',
    campaignType: 'Display',
    channelUsed: 'Website',
    targetAudience: 'All Ages',
    customerSegment: 'Health & Wellness',
    durationDays: 45,
    roi: 3.95,
    acquisitionCost: 1350,
    conversionRate: 2.4,
    clicks: 10200,
    impressions: 310000,
  },
  {
    id: 'CMP-2021-010',
    campaignType: 'Email',
    channelUsed: 'Email',
    targetAudience: 'Women 35-44',
    customerSegment: 'Outdoor Adventurers',
    durationDays: 60,
    roi: 4.90,
    acquisitionCost: 820,
    conversionRate: 3.0,
    clicks: 7600,
    impressions: 160000,
  },
  {
    id: 'CMP-2021-011',
    campaignType: 'Social Media',
    channelUsed: 'Facebook',
    targetAudience: 'All Ages',
    customerSegment: 'Foodies',
    durationDays: 30,
    roi: 5.30,
    acquisitionCost: 1600,
    conversionRate: 3.6,
    clicks: 16400,
    impressions: 320000,
  },
  {
    id: 'CMP-2021-012',
    campaignType: 'Search',
    channelUsed: 'Google Ads',
    targetAudience: 'Men 25-34',
    customerSegment: 'Outdoor Adventurers',
    durationDays: 15,
    roi: 6.05,
    acquisitionCost: 1950,
    conversionRate: 4.3,
    clicks: 18200,
    impressions: 295000,
  }
];

export const CAMPAIGN_TYPES_OPTIONS: CampaignType[] = [
  'Display',
  'Email',
  'Influencer',
  'Search',
  'Social Media',
];

export const CHANNEL_USED_OPTIONS: ChannelUsed[] = [
  'Email',
  'Facebook',
  'Google Ads',
  'Instagram',
  'Website',
  'YouTube',
];

export const TARGET_AUDIENCE_OPTIONS: TargetAudience[] = [
  'All Ages',
  'Men 18-24',
  'Men 25-34',
  'Women 25-34',
  'Women 35-44',
];

export const CUSTOMER_SEGMENT_OPTIONS: CustomerSegment[] = [
  'Fashionistas',
  'Foodies',
  'Health & Wellness',
  'Outdoor Adventurers',
  'Tech Enthusiasts',
];

export const DURATION_DAYS_OPTIONS: DurationDays[] = [15, 30, 45, 60];

