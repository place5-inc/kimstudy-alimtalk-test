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
): Promise<BackendResponse> {
  const { AZURE_API_BASE, BACKEND_SHARED_SECRET } = getEnv();
  const baseUrl = env === 'prod' ? PROD_API_BASE : AZURE_API_BASE;
  const qs = query.toString();
  // path는 /admin/test/... 형태. 백엔드 호출 시 /api prefix를 붙임.
  // 이유: 클라/프록시 URL에 /api가 두 번 들어가면 Vercel 라우팅이 깨짐.
  const url = `${baseUrl}/api${path}${qs ? `?${qs}` : ''}`;

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
