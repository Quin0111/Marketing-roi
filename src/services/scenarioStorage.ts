import { MarketingScenario } from '../types';
import { isRecord } from './modelInfoService';
import { validDescription } from './campaignInput';

const KEY = 'dm_scenarios';
const VERSION = 1;
export interface StoredScenarios { scenarios: MarketingScenario[]; notice: string | null; canPersist?: boolean }
export type ScenarioStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function isScenario(value: unknown): value is MarketingScenario {
  if (!isRecord(value) || !isRecord(value.features)) return false;
  const f = value.features;
  return typeof value.id === 'string' && !!value.id.trim()
    && typeof value.name === 'string' && !!value.name.trim()
    && typeof value.createdAt === 'string' && typeof value.updatedAt === 'string'
    && (value.notes === undefined || typeof value.notes === 'string')
    && (value.isBaselinePrediction === undefined || typeof value.isBaselinePrediction === 'boolean')
    && (value.predictedRoi === undefined || (typeof value.predictedRoi === 'number' && Number.isFinite(value.predictedRoi)))
    && validDescription(f);
}

export function loadScenarios(defaults: () => MarketingScenario[], storage?: ScenarioStorage): StoredScenarios {
  try {
    const raw = (storage ?? window.localStorage).getItem(KEY);
    if (raw === null) return { scenarios: defaults(), notice: null };
    const parsed: unknown = JSON.parse(raw);
    const legacy = Array.isArray(parsed);
    if (!legacy && (!isRecord(parsed) || parsed.version !== VERSION || !Array.isArray(parsed.scenarios))) {
      return { scenarios: [], canPersist: false, notice: 'Dữ liệu lưu không đúng cấu trúc hoặc phiên bản chưa được hỗ trợ. Đã mở danh sách rỗng an toàn.' };
    }
    const rows: unknown[] = legacy ? parsed : (parsed as { scenarios: unknown[] }).scenarios;
    const ids = new Set<string>();
    const scenarios = rows.filter((row): row is MarketingScenario => {
      if (!isScenario(row) || ids.has(row.id)) return false;
      ids.add(row.id); return true;
    });
    return { scenarios, ...(scenarios.length !== rows.length ? {canPersist:false} : {}), notice: scenarios.length !== rows.length
      ? 'Đã bỏ qua bản ghi kịch bản không hợp lệ; các bản ghi hợp lệ được giữ lại.'
      : legacy ? 'Đã chuyển dữ liệu kịch bản cũ sang phiên bản lưu trữ hiện tại.' : null };
  } catch {
    return { scenarios: [], canPersist: false, notice: 'Không đọc được dữ liệu lưu. Bạn có thể tạo kịch bản mới; ứng dụng vẫn hoạt động trong bộ nhớ.' };
  }
}

export function saveScenarios(scenarios: MarketingScenario[], storage?: ScenarioStorage): string | null {
  try {
    (storage ?? window.localStorage).setItem(KEY, JSON.stringify({ version: VERSION, scenarios }));
    return null;
  } catch {
    return 'Không lưu được trên trình duyệt. Thay đổi hiện chỉ được giữ trong bộ nhớ và có thể mất khi tải lại.';
  }
}
