// Định nghĩa các loại dữ liệu cốt lõi cho hệ thống DreamMakers - Marketing ROI Intelligence

export type CampaignType = 'Display' | 'Email' | 'Influencer' | 'Search' | 'Social Media';

export type ChannelUsed = 'Email' | 'Facebook' | 'Google Ads' | 'Instagram' | 'Website' | 'YouTube';

export type TargetAudience = 'All Ages' | 'Men 18-24' | 'Men 25-34' | 'Women 25-34' | 'Women 35-44';

export type CustomerSegment = 'Fashionistas' | 'Foodies' | 'Health & Wellness' | 'Outdoor Adventurers' | 'Tech Enthusiasts';

export type DurationDays = 15 | 30 | 45 | 60;

export interface CampaignFeatures {
  // User descriptions; never assume these values satisfy the model domain.
  campaignType: string;
  channelUsed: string;
  targetAudience: string;
  customerSegment: string;
  durationDays: number;
}

// Trạng thái Quality Gate của mô hình Machine Learning
export type ModelQualityStatus = 'UNVERIFIED' | 'BASELINE_ONLY' | 'VALIDATED';

export interface PredictionRequest {
  features: CampaignFeatures;
}

export interface PredictionResponse {
  source: 'MODEL_PREDICTION';
  predictedRoi: number;
  modelUsed: string;
  modelVersion: string;
  qualityStatus: ModelQualityStatus;
  campaignSummary: CampaignFeatures;
  warningNotice: string;
  isBaselineOnly: boolean;
  isResearchOnly: boolean;
  computationTimestamp: string;
}

export interface ApiPredictionRequest {
  Campaign_Type: CampaignType;
  Channel_Used: ChannelUsed;
  Target_Audience: TargetAudience;
  Customer_Segment: CustomerSegment;
  Duration_days: DurationDays;
}

export interface ApiPredictionResponse {
  predicted_roi: number;
  model_name: 'Linear Regression';
  model_version: string;
  quality_status: 'BASELINE_ONLY';
  is_research_only: true;
  warning: string;
}

export interface ModelInfo {
  model_name: 'Linear Regression';
  model_version: string;
  features: string[];
  model_ready: boolean;
  quality_status: 'BASELINE_ONLY';
  is_research_only: true;
  quality_gate_rules: {
    allow_prediction: true;
    allow_automatic_ranking: false;
    allow_optimization_recommendation: false;
  };
  allowed_categories: {
    Campaign_Type: CampaignType[];
    Channel_Used: ChannelUsed[];
    Target_Audience: TargetAudience[];
    Customer_Segment: CustomerSegment[];
  };
  allowed_duration_days: DurationDays[];
  warning: string;
}

export interface MarketingScenario {
  id: string;
  name: string;
  features: CampaignFeatures;
  isBaselinePrediction?: boolean;
  predictedRoi?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API results are session-only and separate from legacy illustrative scores.
export type ScenarioPredictionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; result: PredictionResponse };

export interface ModelMetrics {
  id: string;
  name: string;
  category: 'Baseline' | 'Machine Learning';
  meanMae: number;
  meanRmse: number;
  meanR2: number;
  beatsBaseline: boolean;
  foldsBeatBaseline: number | null; // historical per-fold evidence unavailable
  description: string;
}

export interface CampaignRecord {
  id: string;
  campaignType: CampaignType;
  channelUsed: ChannelUsed;
  targetAudience: TargetAudience;
  customerSegment: CustomerSegment;
  durationDays: DurationDays;
  roi: number;
  acquisitionCost: number;
  conversionRate: number;
  clicks: number;
  impressions: number;
}

