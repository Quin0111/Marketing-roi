import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import httpResults from '../../backend/tests/http_results.json';
import reference from '../../backend/models/reference_prediction.json';
import { API_TIMEOUT_MS, apiRequest, ApiError } from '../../src/services/apiClient';
import { parseModelInfo } from '../../src/services/modelInfoService';
import { parsePrediction, PredictionService, toApiFeatures } from '../../src/services/predictionService';
import { QualityGateService } from '../../src/services/qualityGate';
import { CampaignFeatures } from '../../src/types';
import { ModelProvider } from '../../src/contexts/ModelContext';
import { PredictRoiPage } from '../../src/pages/PredictRoiPage';

const info = parseModelInfo(httpResults.responses.find(row => row.endpoint === '/model-info')!.response);
const response = httpResults.responses.find(row => row.endpoint === '/predict')!.response;
const validFeatures: CampaignFeatures = { campaignType: 'Social Media', channelUsed: 'Facebook',
  targetAudience: 'Women 25-34', customerSegment: 'Fashionistas', durationDays: 30 };
const ok = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('API contract and error handling', () => {
  it('maps Vietnamese UI selections to exactly five technical features', () => {
    expect(toApiFeatures(validFeatures, info)).toEqual(reference.cases[0].features);
    expect(typeof toApiFeatures(validFeatures, info).Duration_days).toBe('number');
  });

  it.each(['campaignType', 'channelUsed', 'targetAudience', 'customerSegment', 'durationDays'])('rejects missing %s before HTTP', async field => {
    const payload = { ...validFeatures };
    delete (payload as Record<string, unknown>)[field];
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    await expect(PredictionService.predictRoi({ features: payload }, info)).rejects.toBeInstanceOf(ApiError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([0, 31, 90, '30', 30.5, true, null])('rejects unsupported duration %s', duration => {
    expect(() => toApiFeatures({ ...validFeatures, durationDays: duration } as CampaignFeatures, info)).toThrow(ApiError);
  });

  it('sends a real fetch call without model selection or fallback computation', async () => {
    const fetch = vi.fn().mockResolvedValue(ok(response)); vi.stubGlobal('fetch', fetch);
    const result = await PredictionService.predictRoi({ features: validFeatures }, info);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(reference.cases[0].features);
    expect(result.predictedRoi).toBe(reference.cases[0].expected_predictions['Linear Regression']);
    expect(result.modelVersion).toBe(info.model_version);
    expect(result.warningNotice).toBe(info.warning);
    expect(result).not.toHaveProperty('confidenceInterval');
  });

  it.each([422, 503, 500])('maps HTTP %s to safe Vietnamese error', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('secret stack trace', { status })));
    await expect(apiRequest('/predict')).rejects.toMatchObject({ code: 'http', status });
    await expect(apiRequest('/predict')).rejects.not.toHaveProperty('message', 'secret stack trace');
  });

  it('handles network failure without fake ROI', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('private system detail')));
    await expect(PredictionService.predictRoi({ features: validFeatures }, info)).rejects.toMatchObject({ code: 'network' });
  });

  it('times out even while awaiting the response', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })));
    const check = expect(apiRequest('/predict')).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS + 1);
    await check;
  });

  it.each([{}, null, { ...response, predicted_roi: '4.99' }, { ...response, predicted_roi: NaN },
    { ...response, predicted_roi: Infinity }, { ...response, quality_status: 'VALIDATED' },
    { ...response, model_name: 'Dummy' }, { ...response, model_version: 'unknown' },
    { ...response, is_research_only: false }, { ...response, warning: '' },
    { ...response, best_campaign: 'A' }])('rejects malformed prediction %#', value => {
    expect(() => parsePrediction(value, info)).toThrow(ApiError);
  });

  it.each([{}, { ...info, quality_status: 'VALIDATED' }, { ...info, allowed_duration_days: [30, 45] },
    { ...info, allowed_categories: { ...info.allowed_categories, Channel_Used: ['Invented'] } },
    { ...info, quality_gate_rules: { ...info.quality_gate_rules, allow_automatic_ranking: true } }])('rejects untrusted model metadata %#', value => {
    expect(() => parseModelInfo(value)).toThrow(ApiError);
  });

  it.each(['UNVERIFIED', 'BASELINE_ONLY', 'VALIDATED'] as const)('never enables optimization in Phase 3 (%s)', status => {
    expect(QualityGateService.getStateDetails(status)).toMatchObject({ canOptimize: false, canAutoRank: false });
  });
});

function mountPage(prediction: () => Promise<Response>) {
  const fetch = vi.fn((url: string) => url.endsWith('/model-info') ? Promise.resolve(ok(info)) : prediction());
  vi.stubGlobal('fetch', fetch);
  render(<ModelProvider><PredictRoiPage /></ModelProvider>);
  return fetch;
}
async function ready() {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Dự đoán ROI', exact: true })).toBeEnabled());
}
function deferred() {
  let resolve!: (value: Response) => void;
  return { promise: new Promise<Response>(done => { resolve = done; }), resolve: (value: Response) => resolve(value) };
}

describe('Prediction page lifecycle', () => {
  it('blocks repeated submit while the request is running', async () => {
    const gate = deferred(); const fetch = mountPage(() => gate.promise);
    await ready();
    const button = screen.getByRole('button', { name: 'Dự đoán ROI', exact: true });
    fireEvent.click(button); fireEvent.click(button);
    expect(fetch.mock.calls.filter(([url]) => url.endsWith('/predict'))).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Đang xử lý/ })).toBeDisabled();
    await act(async () => gate.resolve(ok(response)));
    expect(await screen.findByTestId('predicted-roi')).toBeVisible();
  });

  it('discards an old response even if the transport ignores abort', async () => {
    const old = deferred(); const newer = deferred(); let calls = 0;
    mountPage(() => ++calls === 1 ? old.promise : newer.promise);
    await ready(); fireEvent.click(screen.getByRole('button', { name: 'Dự đoán ROI', exact: true }));
    fireEvent.change(screen.getByLabelText(/1. Loại chiến dịch/), { target: { value: 'Social Media' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dự đoán ROI', exact: true }));
    await act(async () => newer.resolve(ok(response)));
    const currentValue = screen.getByTestId('predicted-roi').getAttribute('data-value');
    await act(async () => old.resolve(ok({ ...response, predicted_roi: 123 })));
    expect(screen.getByTestId('predicted-roi')).toHaveAttribute('data-value', currentValue);
  });

  it('clears a successful ROI on feature change and on reset', async () => {
    mountPage(() => Promise.resolve(ok(response)));
    await ready(); fireEvent.click(screen.getByRole('button', { name: 'Dự đoán ROI', exact: true }));
    await screen.findByTestId('predicted-roi');
    fireEvent.click(screen.getByRole('button',{name:'45 ngày',exact:true}));
    expect(screen.queryByTestId('predicted-roi')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dự đoán ROI', exact: true }));
    await screen.findByTestId('predicted-roi');
    fireEvent.click(screen.getByRole('button', { name: 'Làm mới', exact: true }));
    expect(screen.queryByTestId('predicted-roi')).not.toBeInTheDocument();
  });

  it('clears old ROI and falls back to UNVERIFIED on the next prediction error', async () => {
    let calls = 0;
    mountPage(() => Promise.resolve(++calls === 1 ? ok(response) : new Response('secret', { status: 500 })));
    await ready(); fireEvent.click(screen.getByRole('button', { name: 'Dự đoán ROI', exact: true }));
    await screen.findByTestId('predicted-roi');
    fireEvent.click(screen.getByRole('button', { name: 'Dự đoán ROI', exact: true }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Máy chủ không thể thực hiện dự đoán');
    expect(screen.queryByTestId('predicted-roi')).not.toBeInTheDocument();
    expect(screen.getByText('Chưa được kiểm chứng')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Dự đoán ROI', exact: true })).toBeDisabled();
  });

  it('disables predictions and shows UNVERIFIED if metadata cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    render(<ModelProvider><PredictRoiPage /></ModelProvider>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối được máy chủ');
    expect(screen.getByText('Chưa được kiểm chứng')).toBeVisible();
    expect(screen.queryByTestId('predicted-roi')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dự đoán ROI', exact: true })).toBeDisabled();
  });
});
