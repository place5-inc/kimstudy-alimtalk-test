export interface ProxyCallResult {
  ok: boolean;
  status: number;
  body: string;
}

export class UnauthenticatedError extends Error {
  constructor() {
    super('unauthenticated');
    this.name = 'UnauthenticatedError';
  }
}

async function readBodyText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

export async function fetchJson<T>(input: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, {
    credentials: 'same-origin',
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401) throw new UnauthenticatedError();
  const text = await readBodyText(res);
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  if (!res.ok) {
    const detail = (parsed && typeof parsed === 'object' && 'error' in parsed)
      ? String((parsed as { error: unknown }).error)
      : `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return parsed as T;
}

export async function callProxy(
  backendPath: string,
  params: Record<string, string>,
  options: { confirmToken?: string } = {},
): Promise<ProxyCallResult> {
  const qs = new URLSearchParams(params).toString();
  const url = `/api/proxy${backendPath}${qs ? `?${qs}` : ''}`;
  const headers: Record<string, string> = {
    Accept: 'text/plain, application/json, */*',
  };
  if (options.confirmToken) headers['X-Confirm-Token'] = options.confirmToken;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'same-origin',
    headers,
  });
  if (res.status === 401) throw new UnauthenticatedError();
  const body = await readBodyText(res);
  return { ok: res.ok, status: res.status, body };
}

export async function fetchConfirmToken(action: string): Promise<string> {
  const result = await fetchJson<{ token: string }>('/api/admin/confirm', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
  return result.token;
}
