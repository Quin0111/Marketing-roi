import { ModelInfo } from '../types';
import { CAMPAIGN_TYPE_LABELS, CHANNEL_LABELS, TARGET_AUDIENCE_LABELS, CUSTOMER_SEGMENT_LABELS } from '../constants/translations';
import { apiRequest, contractError } from './apiClient';

export const API_FEATURES = ['Campaign_Type', 'Channel_Used', 'Target_Audience', 'Customer_Segment', 'Duration_days'];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseModelInfo(value: unknown): ModelInfo {
  if (!isRecord(value) || value.model_name !== 'Linear Regression'
    || typeof value.model_version !== 'string' || !value.model_version.trim()
    || typeof value.model_ready !== 'boolean' || value.quality_status !== 'BASELINE_ONLY'
    || value.is_research_only !== true || typeof value.warning !== 'string' || !value.warning.trim()
    || !Array.isArray(value.features) || JSON.stringify(value.features) !== JSON.stringify(API_FEATURES)
    || !isRecord(value.quality_gate_rules) || value.quality_gate_rules.allow_prediction !== true
    || value.quality_gate_rules.allow_automatic_ranking !== false
    || value.quality_gate_rules.allow_optimization_recommendation !== false
    || !isRecord(value.allowed_categories)
    || !Array.isArray(value.allowed_duration_days)
    || JSON.stringify(value.allowed_duration_days) !== '[15,30,45,60]') return contractError();
  const dictionaries = [CAMPAIGN_TYPE_LABELS, CHANNEL_LABELS, TARGET_AUDIENCE_LABELS, CUSTOMER_SEGMENT_LABELS];
  for (const [index, dictionary] of dictionaries.entries()) {
    const values = value.allowed_categories[API_FEATURES[index]];
    if (!Array.isArray(values) || values.length === 0 || new Set(values).size !== values.length
      || !values.every(item => typeof item === 'string' && Object.prototype.hasOwnProperty.call(dictionary, item))) return contractError();
  }
  return value as unknown as ModelInfo;
}

export async function fetchModelInfo(signal?: AbortSignal): Promise<ModelInfo> {
  return parseModelInfo(await apiRequest('/model-info', { signal }));
}
