import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { CampaignFeatures, MarketingScenario, ModelInfo, PredictionResponse, ScenarioPredictionState } from '../types';
import { PredictionService } from '../services/predictionService';
import { errorMessage, isAbortError } from '../services/apiClient';

interface Entry { features: string; metadata: ModelInfo; state: ScenarioPredictionState }
interface Pending { controller: AbortController }
const key = (f: CampaignFeatures) => JSON.stringify([f.campaignType, f.channelUsed, f.targetAudience, f.customerSegment, f.durationDays]);
const idle: ScenarioPredictionState = { status: 'idle' };

export function useScenarioPredictions(info: ModelInfo | null) {
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const pending = useRef(new Map<string, Pending>());

  // Clear obsolete metadata during commit, before the newly enabled button can
  // start a request. A passive effect could abort a new request after paint.
  useLayoutEffect(() => {
    const requests = pending.current;
    for (const request of requests.values()) request.controller.abort();
    requests.clear();
    setEntries({});
    return () => {
      for (const request of requests.values()) request.controller.abort();
      requests.clear();
    };
  }, [info]);

  const clear = useCallback((id: string) => {
    pending.current.get(id)?.controller.abort();
    pending.current.delete(id);
    setEntries(previous => { const next = { ...previous }; delete next[id]; return next; });
  }, []);

  const predict = async (scenario: MarketingScenario) => {
    if (!info?.model_ready || pending.current.has(scenario.id)) return;
    const request: Pending = { controller: new AbortController() };
    const features = { ...scenario.features };
    const snapshot = key(features);
    pending.current.set(scenario.id, request);
    const update = (state: ScenarioPredictionState) => setEntries(previous => ({
      ...previous, [scenario.id]: { features: snapshot, metadata: info, state },
    }));
    const current = () => pending.current.get(scenario.id) === request && !request.controller.signal.aborted;
    update({ status: 'loading' });
    try {
      const result = await PredictionService.predictRoi({ features }, info, request.controller.signal);
      if (current()) update({ status: 'success', result });
    } catch (failure) {
      if (current() && !isAbortError(failure)) update({ status: 'error', message: errorMessage(failure) });
    } finally {
      if (pending.current.get(scenario.id) === request) pending.current.delete(scenario.id);
    }
  };

  const stateFor = (scenario: MarketingScenario): ScenarioPredictionState => {
    const entry = entries[scenario.id];
    // Hide invalid snapshots immediately, before metadata-change effects run.
    return info?.model_ready && entry?.metadata === info && entry.features === key(scenario.features) ? entry.state : idle;
  };
  const adopt = useCallback((scenario: MarketingScenario, result: PredictionResponse, metadata: ModelInfo) => {
    if (!info?.model_ready || metadata !== info || result.modelVersion !== info.model_version
      || result.qualityStatus !== info.quality_status || key(scenario.features) !== key(result.campaignSummary)) return;
    setEntries(previous => ({ ...previous, [scenario.id]: {
      features: key(scenario.features), metadata: info, state: { status: 'success', result },
    } }));
  }, [info]);
  return { predict, clear, stateFor, adopt };
}
