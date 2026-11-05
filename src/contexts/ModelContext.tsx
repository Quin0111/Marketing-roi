import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ModelInfo, ModelQualityStatus } from '../types';
import { fetchModelInfo } from '../services/modelInfoService';
import { errorMessage, isAbortError } from '../services/apiClient';

interface ModelState {
  info: ModelInfo | null;
  status: ModelQualityStatus;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
}

const ModelContext = createContext<ModelState | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  const invalidate = useCallback(() => {
    pending.current?.abort();
    setInfo(null);
    setLoading(false);
  }, []);
  const refresh = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setInfo(null);
    setError(null);
    setLoading(true);
    try {
      const metadata = await fetchModelInfo(controller.signal);
      if (!controller.signal.aborted) setInfo(metadata);
    } catch (failure) {
      if (!isAbortError(failure) && !controller.signal.aborted) setError(errorMessage(failure));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    return () => pending.current?.abort();
  }, [refresh]);
  return <ModelContext.Provider value={{ info, loading, error, refresh, invalidate,
    status: info?.quality_status ?? 'UNVERIFIED' }}>{children}</ModelContext.Provider>;
}

export function useModel(): ModelState {
  const context = useContext(ModelContext);
  if (!context) throw new Error('ModelProvider is required');
  return context;
}
