import React from 'react';

import { ModelComparisonTable } from '../components/modelInsights/ModelComparisonTable';
import { MetricCharts } from '../components/modelInsights/MetricCharts';
import { MetricExplanations } from '../components/modelInsights/MetricExplanations';
import { EmpiricalConclusion } from '../components/modelInsights/EmpiricalConclusion';

import { useModel } from '../contexts/ModelContext';
import { ResearchEvidence } from '../components/modelInsights/ResearchEvidence';

export const ModelInsightsPage: React.FC = () => {
  const { info } = useModel();
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <details className="bg-white border border-slate-200 rounded-xl p-4 text-sm space-y-2" data-testid="historical-provenance"><summary className="cursor-pointer font-semibold">Nguồn, giao thức và phiên bản</summary>
        <h2 className="font-bold">ROI lịch sử — snapshot, có giới hạn tái lập</h2>
        <p>Pipeline đang sử dụng: {info ? `${info.model_name} · phiên bản ${info.model_version} · BASELINE_ONLY` : 'Chưa xác minh được từ Backend'}.</p>
        <p>Nguồn bảng và biểu đồ lịch sử: backend/models/model_metrics.json (artifact 1.0.0), được chép vào src/data/modelResults.ts. Đây không phải metrics động hoặc kết quả Phase 4B mới.</p>
        <p>Audit 4B.1A chưa tái lập được Dummy RMSE 1,732275; thiếu indices và metrics từng fold lịch sử. Giữ nguyên số đã công bố, không suy ra số fold thắng từ metric trung bình.</p>
        <p>ROI và sai số giữ trên thang đo dataset; đơn vị kinh tế chưa xác minh.</p>
      </details>
      {/* 1. Tổng quan hiệu năng mô hình & Kết quả kiểm định chéo */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Hiệu năng mô hình & Kết quả kiểm định chéo (5-Fold Cross-Validation)</span>
          </h2>
          
        </div>
        <p className="text-sm text-slate-600">Linear Regression đang triển khai. Dummy là mốc dự đoán trung bình; mô hình ROI chưa cải thiện ổn định so với mốc này. RMSE đo độ lớn sai số, thấp hơn là tốt hơn trong cùng giao thức.</p>
      </div>

      {/* 2. So sánh mô hình với mô hình cơ sở */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            So sánh mô hình với mô hình cơ sở (Baseline Comparison)
          </h2>
          <p className="text-xs text-slate-500">
            Kết quả trung bình 5 lần kiểm định chéo giữa mô hình cơ sở Dummy Regressor và các thuật toán học máy có giám sát.
          </p>
        </div>

        <ModelComparisonTable />
      </div>

      {/* 3. Trực quan hóa các chỉ số đánh giá (Evaluation Metrics) */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Chỉ số đánh giá: So sánh MAE, RMSE và R²
          </h2>
          <p className="text-xs text-slate-500">
            Trục tung được điều chỉnh theo độ phân giải cao để quan sát sự khác biệt mức phần nghìn giữa các mô hình.
          </p>
        </div>

        <MetricCharts />
      </div>

      {/* 4. Kết quả nghiên cứu & Giới hạn của mô hình */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Kết quả nghiên cứu & Giới hạn của mô hình (Research Findings & Limitations)
          </h2>
        </div>
        <details className="bg-white border rounded-xl p-4"><summary className="font-semibold cursor-pointer">Giới hạn mô hình</summary><EmpiricalConclusion /></details>
      </div>

      {/* 5. Giải thích các chỉ số & Cơ sở lý luận học máy */}
      <div>
        <details className="bg-white border rounded-xl p-4"><summary className="cursor-pointer font-semibold">Giải thích các chỉ số</summary><MetricExplanations /></details>
      </div>
      <details className="bg-white border rounded-xl p-4"><summary className="cursor-pointer font-semibold">Nghiên cứu bổ sung · RESEARCH_LIMITED</summary><ResearchEvidence /></details>
    </div>
  );
};
