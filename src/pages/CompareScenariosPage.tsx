import { resolveModelInput } from '../services/campaignInput';
import React, { useState, useEffect } from 'react';
import { MarketingScenario } from '../types';
import { DemoScenarioService } from '../services/demoScenarioService';
import { useModel } from '../contexts/ModelContext';
import { ScenarioCard } from '../components/scenarios/ScenarioCard';
import { ScenarioComparisonTable } from '../components/scenarios/ScenarioComparisonTable';
import { ScenarioModal } from '../components/scenarios/ScenarioModal';
import { Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useScenarioTransfer } from '../contexts/ScenarioTransferContext';
import { SCIENTIFIC_STATEMENTS } from '../constants/translations';
import { loadScenarios, saveScenarios } from '../services/scenarioStorage';
import { useScenarioPredictions } from '../hooks/useScenarioPredictions';
import { ScenarioSuitability } from '../components/scenarios/ScenarioSuitability';
import { CampaignManagement } from '../components/scenarios/CampaignManagement';
import { useCampaignWorkspace } from '../hooks/useCampaignWorkspace';
import { SuggestedCampaign } from '../services/campaignSuggestions';
import { MarketingContext } from '../services/marketingContext';

export const CompareScenariosPage: React.FC = () => {
  const { info, loading, refresh } = useModel();
  const predictions = useScenarioPredictions(info);
  const campaigns=useCampaignWorkspace();
  const [campaignId,setCampaignId]=useState<string>();
  const createCampaign=(scenario:MarketingScenario,context:MarketingContext,suggestion?:SuggestedCampaign)=>setCampaignId(campaigns.create(scenario,context,suggestion));
  const [initial] = useState(() => loadScenarios(DemoScenarioService.getInitialScenarios));
  const [scenarios, setScenarios] = useState<MarketingScenario[]>(initial.scenarios);
  const [storageNotice, setStorageNotice] = useState<string | null>(initial.notice);

  const handoff = useScenarioTransfer();
  const transfer = handoff?.transfer;
  const publish = handoff?.publish;
  useEffect(() => {
    if (!transfer || !info) return;
    const stored = scenarios.find(row => row.id === transfer.scenario.id);
    if (stored) predictions.adopt(stored, transfer.result, transfer.metadata);
    publish?.(null);
  }, [transfer, publish, info, predictions.adopt, scenarios]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<MarketingScenario | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Đồng bộ hóa kịch bản vào LocalStorage
  useEffect(() => {
    if (initial.canPersist === false) return;
    const failure = saveScenarios(scenarios);
    if (failure) setStorageNotice(failure);
  }, [scenarios]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreateModal = () => {
    setEditingScenario(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (scenario: MarketingScenario) => {
    setEditingScenario(scenario);
    setIsModalOpen(true);
  };

  const handleSaveScenario = (
    data: Omit<MarketingScenario, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (id) {
      predictions.clear(id);
      // Chỉnh sửa kịch bản hiện có
      setScenarios((prev) =>
        prev.map((sc) =>
          sc.id === id
            ? {
                ...sc,
                name: data.name,
                notes: data.notes,
                features: data.features,
                predictedRoi: undefined,
                isBaselinePrediction: undefined,
                updatedAt: now,
              }
            : sc
        )
      );
      showToast(SCIENTIFIC_STATEMENTS.savedChangesNotice);
    } else {
      // Tạo kịch bản mới
      const newScenario: MarketingScenario = {
        id: `sc-${crypto.randomUUID()}`,
        name: data.name,
        notes: data.notes,
        features: data.features,
        createdAt: now,
        updatedAt: now,
      };
      setScenarios((prev) => [newScenario, ...prev]);
      showToast('Đã thêm kịch bản mới thành công.');
    }
  };

  const handleDuplicate = (scenario: MarketingScenario) => {
    const now = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const duplicated: MarketingScenario = {
      ...scenario,
      id: `sc-${crypto.randomUUID()}`,
      name: `${scenario.name} (Bản sao)`,
      createdAt: now,
      updatedAt: now,
    };
    setScenarios((prev) => [duplicated, ...prev]);
    showToast('Đã nhân bản kịch bản thành công.');
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(SCIENTIFIC_STATEMENTS.deleteScenarioConfirm);
    if (!confirmed) return;
    predictions.clear(id);
    setScenarios((prev) => prev.filter((sc) => sc.id !== id));
    showToast('Đã xóa kịch bản.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {storageNotice && <div role="status" aria-label="Thông báo lưu trữ kịch bản" className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">{storageNotice}</div>}
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 p-4 bg-mist text-ink rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Thanh tác vụ trên cùng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl p-6 border border-slate-200/90 shadow-card">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              So sánh &amp; Đề xuất
            </h2>

          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Dự đoán từng kịch bản qua API /predict. ROI mô phỏng là dữ liệu minh họa cũ, không phải kết quả mô hình.
            {' '}Kết quả ROI chỉ phục vụ nghiên cứu, không dùng để xếp hạng hoặc khuyến nghị tối ưu.
          </p>
          <details className="text-xs text-slate-500 mt-2"><summary className="cursor-pointer">Nguồn và lưu trữ kết quả</summary>
            <p>MODEL_PREDICTION: API thật; DEMO_DATA: ROI mô phỏng; NOT_PREDICTED: chưa có kết quả API. Kết quả API chỉ giữ trong phiên hiện tại; chỉnh sửa hoặc tải lại cần dự đoán lại. Cấu hình được lưu riêng trên trình duyệt. ROI theo thang đo dataset, không phải lợi nhuận; chênh lệch nhỏ không chứng minh hiệu quả Marketing thực tế.</p>
          </details>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-slate-800 font-semibold text-xs shadow-md shadow-none hover:bg-blue-200 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm kịch bản</span>
        </button>
      </div>

      <div className="text-sm text-slate-600 flex flex-wrap gap-3 items-center">
        <span>{loading ? 'Đang xác minh mô hình Backend…' : info?.model_ready ? `${info.model_name} · ${info.model_version} · ${info.quality_status}` : 'Chưa xác minh được mô hình; vẫn có thể quản lý cấu hình.'}</span>
        <button type="button" disabled={loading} onClick={() => void refresh()} className="underline font-semibold disabled:opacity-50">Xác minh lại mô hình</button>
      </div>

      {/* Phần giữa: Danh sách các thẻ kịch bản */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Danh sách kịch bản đang thử nghiệm ({scenarios.length})
          </h3>
          <span className="text-xs text-slate-400">
            Hỗ trợ Chỉnh sửa, Nhân bản và Xóa
          </span>
        </div>

        {scenarios.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            {SCIENTIFIC_STATEMENTS.emptyScenariosNotice}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onEdit={handleOpenEditModal}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                prediction={predictions.stateFor(scenario)}
                canPredict={Boolean(info?.model_ready && resolveModelInput(scenario.features, info).features)}
                compatibilityIssues={resolveModelInput(scenario.features,info).issues}
                onPredict={() => void predictions.predict(scenario)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Phần dưới: Bảng so sánh các kịch bản và Biểu đồ đối chiếu */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Kết quả so sánh các kịch bản
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Đối chiếu cấu hình và kết quả có nguồn rõ ràng; trạng thái BASELINE_ONLY không cho phép kết luận phương án tốt hơn.
          </p>
        </div>

        {scenarios.length < 2 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{SCIENTIFIC_STATEMENTS.minScenariosNotice}</span>
          </div>
        )}

        <ScenarioComparisonTable scenarios={scenarios} predictionFor={predictions.stateFor} afterChart={<ScenarioSuitability scenarios={scenarios} predictionFor={predictions.stateFor} onCreateCampaign={createCampaign}/>} />
      </div>

      <CampaignManagement workspace={campaigns} requestedId={campaignId} />

      {/* Cửa sổ thêm / chỉnh sửa kịch bản */}
      <ScenarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveScenario}
        initialData={editingScenario}
        modelInfo={info}
      />
    </div>
  );
};
