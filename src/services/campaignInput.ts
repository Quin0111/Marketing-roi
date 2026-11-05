import { CampaignFeatures, ModelInfo } from '../types';
import { CAMPAIGN_TYPE_LABELS, CHANNEL_LABELS, TARGET_AUDIENCE_LABELS, CUSTOMER_SEGMENT_LABELS } from '../constants/translations';

export const INPUT_FIELDS = [
  { key: 'campaignType', api: 'Campaign_Type', label: 'Loại chiến dịch', labels: CAMPAIGN_TYPE_LABELS },
  { key: 'channelUsed', api: 'Channel_Used', label: 'Kênh Marketing', labels: CHANNEL_LABELS },
  { key: 'targetAudience', api: 'Target_Audience', label: 'Đối tượng mục tiêu', labels: TARGET_AUDIENCE_LABELS },
  { key: 'customerSegment', api: 'Customer_Segment', label: 'Phân khúc khách hàng', labels: CUSTOMER_SEGMENT_LABELS },
] as const;
export const positiveDays = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
export function validDescription(value: unknown): value is CampaignFeatures {
  if (!value || typeof value !== 'object') return false;
  const f = value as CampaignFeatures;
  return INPUT_FIELDS.every(({key}) => typeof f[key] === 'string' && !!f[key].trim() && f[key].length <= 500) && positiveDays(f.durationDays);
}
const normalize = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
// Exact normalized technical label OR its explicit Vietnamese display label.
// No fuzzy matching, accent removal, inference or nearest-category substitution.
export function resolveModelInput(description: CampaignFeatures, info: ModelInfo | null): { features: CampaignFeatures | null; issues: string[] } {
  const issues: string[] = [];
  const features = { ...description };
  for (const {key, api, label, labels} of INPUT_FIELDS) {
    const raw = description[key];
    if (typeof raw !== 'string' || !raw.trim()) { issues.push(`${label}: chưa nhập.`); continue; }
    if (!info) { issues.push(`${label}: chưa xác minh vì chưa có /model-info.`); continue; }
    const matches = info.allowed_categories[api].filter(v => normalize(v) === normalize(raw)
      || (Object.prototype.hasOwnProperty.call(labels, v) && normalize(labels[v]) === normalize(raw)));
    if (matches.length !== 1) issues.push(`${label}: “${raw}” chưa được mô hình hỗ trợ.`);
    else features[key] = matches[0];
  }
  if (!positiveDays(description.durationDays)) issues.push('Thời lượng: phải là số nguyên dương an toàn.');
  else if (!info || !(info.allowed_duration_days as number[]).includes(description.durationDays)) issues.push(`Thời lượng: ${description.durationDays} ngày chưa được mô hình hỗ trợ${info ? ` (${info.allowed_duration_days.join(', ')} ngày)` : ' hoặc chưa xác minh'}.`);
  return { features: issues.length ? null : features, issues };
}
