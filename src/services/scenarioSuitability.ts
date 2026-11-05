import { CampaignFeatures, MarketingScenario } from '../types';

export type CriterionMode = 'required' | 'preferred';
export type CriterionField = 'channelUsed' | 'durationDays' | 'targetAudience' | 'customerSegment';
export type SuitabilityCriterion = {
  field: Exclude<CriterionField, 'durationDays'>;
  value: string;
  mode: CriterionMode;
} | { field: 'durationDays'; value: number; mode: CriterionMode; comparison: 'exact' | 'maximum' };
export interface CriterionMatch { criterion: SuitabilityCriterion; actual: string | number; matched: boolean }
export interface SuitabilityAssessment { id: string; name: string; eligible: boolean; score: number; matches: CriterionMatch[] }
export interface SuitabilityEvaluation {
  status: 'needs_criteria' | 'empty' | 'no_eligible' | 'no_preference_match' | 'unique' | 'tie';
  assessments: SuitabilityAssessment[];
  selectedIds: string[];
  preferenceCount: number;
}

// Protocol rules-v1: exact categorical matches; duration exact or <= maximum.
// Required conditions are filters, never compensated by preferred matches.
// Each preferred match has fixed weight 1. No model output enters this function.
export function evaluateScenarioSuitability(
  scenarios: readonly Pick<MarketingScenario, 'id' | 'name' | 'features'>[],
  criteria: readonly SuitabilityCriterion[],
): SuitabilityEvaluation {
  const preferenceCount = criteria.filter(c => c.mode === 'preferred').length;
  const assessments = scenarios.map(scenario => {
    const matches = criteria.map(criterion => {
      const actual = scenario.features[criterion.field];
      const matched = criterion.field === 'durationDays'
        ? typeof actual === 'number' && (criterion.comparison === 'maximum' ? actual <= criterion.value : actual === criterion.value)
        : actual === criterion.value;
      return { criterion, actual, matched };
    });
    return { id: scenario.id, name: scenario.name,
      eligible: matches.every(m => m.criterion.mode !== 'required' || m.matched),
      score: matches.filter(m => m.criterion.mode === 'preferred' && m.matched).length, matches };
  });
  const base = { assessments, selectedIds: [] as string[], preferenceCount };
  if (!criteria.length) return { ...base, status: 'needs_criteria' };
  if (!scenarios.length) return { ...base, status: 'empty' };
  const eligible = assessments.filter(s => s.eligible);
  if (!eligible.length) return { ...base, status: 'no_eligible' };
  const bestScore = Math.max(...eligible.map(s => s.score));
  if (preferenceCount && bestScore === 0) return { ...base, status: 'no_preference_match' };
  const selectedIds = eligible.filter(s => s.score === bestScore).map(s => s.id);
  return { ...base, selectedIds, status: selectedIds.length === 1 ? 'unique' : 'tie' };
}

export const SUITABILITY_FIELDS: { field: keyof CampaignFeatures; label: string }[] = [
  { field: 'campaignType', label: 'Loại chiến dịch' }, { field: 'channelUsed', label: 'Kênh Marketing' },
  { field: 'durationDays', label: 'Thời lượng' }, { field: 'targetAudience', label: 'Nhóm khách hàng' },
  { field: 'customerSegment', label: 'Phân khúc' },
];
