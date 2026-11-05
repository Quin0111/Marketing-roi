const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://127.0.0.1:8000';
export const API_BASE_URL = configuredUrl.replace(/\/+$/, '');
const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000);
export const API_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0
  ? configuredTimeout : 10000;

export class ApiError extends Error {
  constructor(message: string, public readonly code: 'network' | 'timeout' | 'http' | 'contract' | 'input', public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function contractError(): never {
  throw new ApiError('Phản hồi từ máy chủ không hợp lệ. Vui lòng tải lại thông tin mô hình.', 'contract');
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Không thể thực hiện yêu cầu. Vui lòng thử lại.';
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  const controller = new AbortController();
  const parentSignal = options.signal;
  const abort = () => controller.abort();
  if (parentSignal?.aborted) controller.abort();
  parentSignal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, API_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options, headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
    });
    if (!response.ok) {
      const messages: Record<number, string> = {
        422: 'Thông tin chiến dịch không hợp lệ. Vui lòng kiểm tra đủ năm đặc trưng và thời lượng.',
        503: 'Mô hình chưa sẵn sàng. Vui lòng tải lại thông tin mô hình và thử lại sau.',
        500: 'Máy chủ không thể thực hiện dự đoán. Vui lòng thử lại sau.',
      };
      throw new ApiError(messages[response.status] || 'Yêu cầu không thành công. Vui lòng thử lại.', 'http', response.status);
    }
    try {
      return await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      return contractError();
    }
  } catch (error) {
    if (parentSignal?.aborted) throw new DOMException('Yêu cầu đã được hủy.', 'AbortError');
    if (timedOut) throw new ApiError('Yêu cầu quá thời gian chờ. Vui lòng kiểm tra kết nối và thử lại.', 'timeout');
    if (error instanceof ApiError) throw error;
    throw new ApiError('Không kết nối được máy chủ. Vui lòng kiểm tra Backend và thử lại.', 'network');
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener('abort', abort);
  }
}
