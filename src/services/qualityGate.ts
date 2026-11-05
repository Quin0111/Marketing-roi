import { ModelQualityStatus } from '../types';
import { QUALITY_STATUS_LABELS, SCIENTIFIC_STATEMENTS } from '../constants/translations';

// Display backend state only; no local evaluation or promotion to VALIDATED.
export class QualityGateService {
  public static getStateDetails(status: ModelQualityStatus) {
    return {
      status,
      statusLabel: QUALITY_STATUS_LABELS[status],
      statusDescription: status === 'BASELINE_ONLY' ? SCIENTIFIC_STATEMENTS.qualityGateWarning
        : 'Chưa xác minh được trạng thái mô hình từ Backend. Không sử dụng để khuyến nghị tối ưu.',
      canOptimize: false,
      canAutoRank: false,
      isVerified: false,
    };
  }
}
