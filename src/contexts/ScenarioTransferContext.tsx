import { createContext, ReactNode, useContext, useState } from 'react';
import { MarketingScenario, ModelInfo, PredictionResponse } from '../types';

// Only actual, parsed API responses enter this in-memory handoff. Never hydrate it from disk.
export interface ScenarioTransfer { scenario: MarketingScenario; result: PredictionResponse; metadata: ModelInfo }
const Context = createContext<{ transfer: ScenarioTransfer | null; publish: (value: ScenarioTransfer | null) => void } | null>(null);
export function ScenarioTransferProvider({ children }: { children: ReactNode }) {
  const [transfer, publish] = useState<ScenarioTransfer | null>(null);
  return <Context.Provider value={{ transfer, publish }}>{children}</Context.Provider>;
}
export const useScenarioTransfer = () => useContext(Context);
