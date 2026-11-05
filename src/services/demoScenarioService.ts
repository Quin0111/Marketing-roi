import { CampaignFeatures, MarketingScenario } from '../types';

// Explicitly illustrative data; never used by the prediction API.
export class DemoScenarioService {
  public static getInitialScenarios(): MarketingScenario[] {
    const sc1Features: CampaignFeatures = {
      campaignType: 'Search',
      channelUsed: 'Google Ads',
      targetAudience: 'Men 25-34',
      customerSegment: 'Tech Enthusiasts',
      durationDays: 30,
    };

    const sc2Features: CampaignFeatures = {
      campaignType: 'Social Media',
      channelUsed: 'Instagram',
      targetAudience: 'Women 25-34',
      customerSegment: 'Fashionistas',
      durationDays: 15,
    };

    return [
      {
        id: 'sc-1',
        name: 'Kịch bản A: Quảng cáo tìm kiếm khách hàng công nghệ',
        features: sc1Features,
        isBaselinePrediction: true,
        predictedRoi: 5.035,
        notes: 'Thử nghiệm hướng tới nhóm khách hàng nam yêu thích công nghệ qua Google Ads trong 30 ngày.',
        createdAt: '03/11/2026 09:00',
        updatedAt: '03/11/2026 09:00',
      },
      {
        id: 'sc-2',
        name: 'Kịch bản B: Tiếp thị thời trang nữ trên Instagram',
        features: sc2Features,
        isBaselinePrediction: true,
        predictedRoi: 5.016,
        notes: 'Chiến dịch ngắn ngày 15 ngày giới thiệu bộ sưu tập thời trang nữ trên Instagram.',
        createdAt: '03/11/2026 09:15',
        updatedAt: '03/11/2026 09:15',
      }
    ];
  }
}
