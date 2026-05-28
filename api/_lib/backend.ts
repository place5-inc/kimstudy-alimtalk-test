import { getEnv } from './env.js';

export interface BackendResponse {
  status: number;
  body: string;
  contentType: string;
}

export async function callBackend(
  method: 'GET' | 'POST',
  path: string,
  query: URLSearchParams,
  body: string | null,
): Promise<BackendResponse> {
  const { AZURE_API_BASE, BACKEND_SHARED_SECRET } = getEnv();
  const qs = query.toString();
  const url = `${AZURE_API_BASE}${path}${qs ? `?${qs}` : ''}`;

  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${BACKEND_SHARED_SECRET}`,
      Accept: 'application/json, text/plain, */*',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body && method !== 'GET' ? { body } : {}),
  };

  const res = await fetch(url, init);
  const text = await res.text();
  return {
    status: res.status,
    body: text,
    contentType: res.headers.get('content-type') ?? 'text/plain; charset=utf-8',
  };
}
