import React, { useState } from 'react';
import { MODEL_INSIGHT_METRICS_INFO } from '../../data/modelResults';
import { BookOpen, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const MetricExplanations: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-card space-y-4">
      <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
        <div className="p-2 rounded-xl bg-blue-50 text-ink">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base tracking-tight">Giải thích các chỉ số đánh giá & Kiến thức Machine Learning</h3>
          <p className="text-xs text-slate-500">Cơ sở lý luận khoa học đằng sau quá trình đánh giá và ra quyết định của đề tài.</p>
        </div>
      </div>

      <div className="space-y-3">
        {MODEL_INSIGHT_METRICS_INFO.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all ${
                isOpen ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 font-semibold text-sm text-slate-800">
                  <HelpCircle className={`w-4 h-4 ${isOpen ? 'text-ink' : 'text-slate-400'}`} />
                  <span>{item.term}</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-ink" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-blue-100/60 mt-1">
                  {item.definition}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
