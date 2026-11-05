import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MarketingScenario, ModelInfo, CampaignFeatures } from '../../types';
import { validDescription } from '../../services/campaignInput';
import { CampaignDescriptionFields } from '../prediction/CampaignDescriptionFields';
import { X, Check } from 'lucide-react';
interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scenario: Omit<MarketingScenario, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  initialData?: MarketingScenario | null;
  modelInfo?: ModelInfo | null;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  modelInfo,
}) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  const [nameError, setNameError] = useState(false);
  const [featureError, setFeatureError] = useState<string | null>(null);
  const [features, setFeatures] = useState<CampaignFeatures>({
    campaignType: 'Search',
    channelUsed: 'Google Ads',
    targetAudience: 'Men 25-34',
    customerSegment: 'Tech Enthusiasts',
    durationDays: 30,
  });

  useEffect(() => {
    setNameError(false);
    setFeatureError(null);
    if (initialData) {
      setName(initialData.name);
      setNotes(initialData.notes || '');
      setFeatures(initialData.features);
    } else {
      setName(`Kịch bản chiến dịch #${Math.floor(Math.random() * 900) + 100}`);
      setNotes('');
      setFeatures({
        campaignType: 'Social Media',
        channelUsed: 'Instagram',
        targetAudience: 'Women 25-34',
        customerSegment: 'Fashionistas',
        durationDays: 15,
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector<HTMLInputElement>('input')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const elements = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, [tabindex="0"]');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameError(true); return; }
    if (!validDescription(features)) { setFeatureError('Nhập đầy đủ mô tả và thời lượng nguyên dương.'); return; }

    onSave(
      {
        name: name.trim(),
        notes: notes.trim(),
        features,
        isBaselinePrediction: true,
      },
      initialData?.id
    );
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60  animate-in fade-in duration-150">
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="scenario-dialog-title" className="bg-white rounded-xl max-w-lg w-full max-h-[calc(100dvh-2rem)] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
        <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 id="scenario-dialog-title" className="font-bold text-slate-900 text-base">
            {initialData ? 'Chỉnh sửa kịch bản chiến dịch' : 'Thêm kịch bản mới'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto min-h-0">
          {featureError && <p role="alert" className="text-sm text-rose-700">{featureError}</p>}
          <div>
            <label htmlFor="scenario-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Tên kịch bản <span className="text-rose-500">*</span>
            </label>
            <input
              id="scenario-name"
              aria-invalid={nameError}
              aria-describedby={nameError ? 'scenario-name-error' : undefined}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Kịch bản tiếp cận khách hàng công nghệ Q4"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {nameError && <p id="scenario-name-error" className="text-xs text-rose-700">Tên kịch bản không được chỉ chứa khoảng trắng.</p>}
          </div>

          <CampaignDescriptionFields prefix="scenario" features={features} info={modelInfo} onChange={f=>{setFeatures(f);setFeatureError(null);}} />
          <p className="text-xs text-slate-600">Có thể lưu mô tả chưa được mô hình hỗ trợ; khả năng dự đoán được kiểm tra riêng.</p>

          <div>
            <label htmlFor="scenario-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú kịch bản (tùy chọn)
            </label>
            <textarea
              id="scenario-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Định hướng chiến dịch dịp lễ hội hoặc ra mắt sản phẩm..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          </div>
          <div className="shrink-0 p-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-slate-800 text-xs font-semibold hover:bg-blue-200 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Lưu thay đổi' : 'Lưu kịch bản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>, document.body
  );
};
