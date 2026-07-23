import { getEnv } from './env.js';

export interface BackendResponse {
  status: number;
  body: string;
  contentType: string;
}

const PROD_API_BASE = 'https://adminapi.place5.com';

export async function callBackend(
  method: 'GET' | 'POST',
  path: string,
  query: URLSearchParams,
  body: string | null,
  env?: string,
  overrideBaseUrl?: string,
): Promise<BackendResponse> {
  const { AZURE_API_BASE, BACKEND_SHARED_SECRET } = getEnv();
  const qs = query.toString();
  // overrideBaseUrl 지정 시: 해당 URL + path 그대로 사용 (/api prefix 이미 포함됨).
  // 미지정 시: 환경별 기본 호스트 + /api prefix 붙임.
  const url = overrideBaseUrl
    ? `${overrideBaseUrl}${path}${qs ? `?${qs}` : ''}`
    : `${env === 'prod' ? PROD_API_BASE : AZURE_API_BASE}/api${path}${qs ? `?${qs}` : ''}`;

  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${BACKEND_SHARED_SECRET}`,
      Accept: 'application/json, text/plain, */*',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body && method !== 'GET' ? { body } : {}),
  };

  console.log(`[backend] ${method} ${url}`);
  const res = await fetch(url, init);
  const text = await res.text();
  console.log(`[backend] response ${res.status}`);
  return {
    status: res.status,
    body: text,
    contentType: res.headers.get('content-type') ?? 'text/plain; charset=utf-8',
  };
}
