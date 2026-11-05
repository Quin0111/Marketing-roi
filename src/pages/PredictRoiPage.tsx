import { useCallback, useEffect, useRef, useState } from 'react';
import { CampaignFeatures, PredictionResponse } from '../types';
import { PredictionForm } from '../components/prediction/PredictionForm';
import { PredictionResultCard } from '../components/prediction/PredictionResultCard';
import { PredictionService } from '../services/predictionService';
import { ApiError, errorMessage, isAbortError } from '../services/apiClient';
import { Card } from '../components/common/Card';
import { useScenarioTransfer } from '../contexts/ScenarioTransferContext';
import { loadScenarios, saveScenarios } from '../services/scenarioStorage';
import { DemoScenarioService } from '../services/demoScenarioService';
import { useModel } from '../contexts/ModelContext';
import { Cpu } from 'lucide-react';
import { ModelInformation } from '../components/prediction/ModelInformation';

export const PredictRoiPage = ({ modelInfoRequest }: { modelInfoRequest?: number }) => {
  const model = useModel();
  const handoff = useScenarioTransfer();
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  const generation = useRef(0);

  const clearPrediction = useCallback(() => {
    ++generation.current;
    pending.current?.abort();
    pending.current = null;
    setPredictionResult(null);
    setIsLoading(false);
    setError(null);
  }, []);

  useEffect(() => () => {
    ++generation.current;
    pending.current?.abort();
  }, []);

  useEffect(() => {
    if (!model.info) {
      ++generation.current;
      pending.current?.abort();
      pending.current = null;
      setPredictionResult(null);
      setIsLoading(false);
    }
  }, [model.info]);

  const handlePredict = async (features: CampaignFeatures) => {
    if (pending.current || !model.info?.model_ready) return;
    const controller = new AbortController();
    pending.current = controller;
    const id = ++generation.current;
    setPredictionResult(null);
    setError(null);
    setIsLoading(true);
    try {
      const response = await PredictionService.predictRoi({ features }, model.info, controller.signal);
      if (id === generation.current && !controller.signal.aborted) setPredictionResult(response);
    } catch (failure) {
      if (id === generation.current && !controller.signal.aborted && !isAbortError(failure)) {
        setPredictionResult(null);
        setError(errorMessage(failure));
        if (!(failure instanceof ApiError) || failure.code !== 'input') model.invalidate();
      }
    } finally {
      if (id === generation.current) {
        pending.current = null;
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="text-sm text-slate-600 flex flex-wrap items-center gap-3">
        <span role="status">{model.loading ? 'Đang tải thông tin mô hình...' : model.info?.model_ready
          ? `Mô hình sẵn sàng: ${model.info.model_name} · Phiên bản ${model.info.model_version}` : 'Chưa được kiểm chứng'}</span>
        <button type="button" disabled={model.loading} onClick={() => { clearPrediction(); void model.refresh(); }}
          className="text-blue-700 underline disabled:opacity-50">Tải lại thông tin mô hình</button>
      </div>
      <ModelInformation revealRequest={modelInfoRequest} />
      {(error || model.error) && <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm">{error || model.error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 min-w-0">
          <Card title={<div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-ink" /><span>Cấu hình 5 đặc trưng chiến dịch</span></div>}
            subtitle="Lựa chọn được xác minh từ mô hình Backend; kết quả chỉ phục vụ nghiên cứu">
            <PredictionForm onSubmit={handlePredict} isLoading={isLoading} modelInfo={model.info}
              onChange={clearPrediction} onReset={clearPrediction} onSave={features=>{
                const existing=loadScenarios(DemoScenarioService.getInitialScenarios);
                if(existing.canPersist===false)return 'Chưa thể lưu an toàn: '+existing.notice;
                const now=new Date().toISOString();
                return saveScenarios([...existing.scenarios,{id:`sc-${crypto.randomUUID()}`,name:`Kịch bản từ cấu hình ${new Date().toLocaleString('vi-VN')}`,features:{...features},createdAt:now,updatedAt:now}]);
              }} />
          </Card>
        </div>
        <div className="lg:col-span-5 min-w-0 space-y-6">
          <PredictionResultCard result={predictionResult} isLoading={isLoading} onAddToComparison={handoff ? result => {
            if (!model.info || !model.info.model_ready) return;
            const existing = loadScenarios(DemoScenarioService.getInitialScenarios);
            if (existing.notice && !existing.notice.startsWith('Đã chuyển dữ liệu')) {
              setError('Chưa thể lưu an toàn: ' + existing.notice); return;
            }
            const now = new Date().toISOString();
            const scenario = { id: `sc-${crypto.randomUUID()}`, name: `Kịch bản từ dự đoán ${new Date().toLocaleString('vi-VN')}`,
              features: { ...result.campaignSummary }, createdAt: now, updatedAt: now };
            const failure = saveScenarios([...existing.scenarios, scenario]);
            if (failure) { setError(failure); return; }
            handoff.publish({ scenario, result, metadata: model.info });
            window.location.hash = 'scenarios';
          } : undefined} />

        </div>
      </div>
    </div>
  );
};
