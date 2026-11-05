import { ApiPredictionRequest, ApiPredictionResponse, CampaignFeatures, ModelInfo, PredictionRequest, PredictionResponse } from '../types';
import { ApiError, apiRequest, contractError } from './apiClient';
import { resolveModelInput } from './campaignInput';
import { isRecord } from './modelInfoService';

export function toApiFeatures(features: CampaignFeatures, info: ModelInfo): ApiPredictionRequest {
  const resolved = resolveModelInput(features, info);
  if (!resolved.features) throw new ApiError(resolved.issues.join(" "), "input");
  features = resolved.features;
  const payload = {
    Campaign_Type: features.campaignType,
    Channel_Used: features.channelUsed,
    Target_Audience: features.targetAudience,
    Customer_Segment: features.customerSegment,
    Duration_days: features.durationDays,
  };
  for (const key of ['Campaign_Type', 'Channel_Used', 'Target_Audience', 'Customer_Segment'] as const) {
    if (!(info.allowed_categories[key] as string[]).includes(payload[key])) {
      throw new ApiError('Vui lòng chọn đầy đủ năm đặc trưng trong danh sách mô hình hỗ trợ.', 'input');
    }
  }
  if (!Number.isInteger(payload.Duration_days) || !(info.allowed_duration_days as number[]).includes(payload.Duration_days)) {
    throw new ApiError('Thời lượng phải là số nguyên 15, 30, 45 hoặc 60 ngày.', 'input');
  }
  return payload as ApiPredictionRequest;
}

export function parsePrediction(value: unknown, info: ModelInfo): ApiPredictionResponse {
  if (!isRecord(value) || typeof value.predicted_roi !== 'number' || !Number.isFinite(value.predicted_roi)
    || value.model_name !== info.model_name || value.model_version !== info.model_version
    || value.quality_status !== info.quality_status || value.quality_status !== 'BASELINE_ONLY'
    || value.is_research_only !== true || typeof value.warning !== 'string' || !value.warning.trim()
    || 'best_campaign' in value || 'recommended_campaign' in value) return contractError();
  return value as unknown as ApiPredictionResponse;
}

export class PredictionService {
  public static async predictRoi(request: PredictionRequest, info: ModelInfo, signal?: AbortSignal): Promise<PredictionResponse> {
    if (!info.model_ready) throw new ApiError('Mô hình chưa sẵn sàng. Vui lòng tải lại thông tin mô hình.', 'http', 503);
    const features = { ...request.features };
    const payload = toApiFeatures(features, info);
    const result = parsePrediction(await apiRequest('/predict', {
      method: 'POST', body: JSON.stringify(payload), signal,
    }), info);
    return {
      source: 'MODEL_PREDICTION',
      predictedRoi: result.predicted_roi,
      modelUsed: result.model_name,
      modelVersion: result.model_version,
      qualityStatus: result.quality_status,
      campaignSummary: features,
      warningNotice: result.warning,
      isBaselineOnly: result.quality_status === 'BASELINE_ONLY',
      isResearchOnly: result.is_research_only,
      computationTimestamp: new Date().toLocaleTimeString('vi-VN'),
    };
  }
}
