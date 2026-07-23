import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { getEnv } from './_lib/env.js';
import { requireAuth, readSessionToken } from './_lib/session.js';
import { verifyOrigin } from './_lib/csrf.js';
import { matchAllowlist } from './_lib/allowlist.js';
import { verifyConfirm } from './_lib/jwt.js';
import { callBackend } from './_lib/backend.js';
import { rateLimit } from './_lib/ratelimit.js';

/**
 * 단일 경로 프록시 함수.
 *
 * 왜 catch-all (`/api/proxy/[...path].ts`) 대신 이 구조인가:
 *   Vercel의 엣지 라우팅이 다중 세그먼트 catch-all 요청에 대해
 *   함수 매칭을 건너뛰고 자체 404(NOT_FOUND)를 반환하는 동작을 확인.
 *   `/api/proxy/foo`는 401(인증 안됨, 함수 도달)이지만
 *   `/api/proxy/foo/bar`는 404(함수 미도달)였음.
 *
 * 그래서 백엔드 path를 쿼리스트링 `_p`로 전달하는 단일 경로 방식으로 통일.
 *
 * 클라이언트 호출 예:
 *   GET /api/proxy?_p=/admin/test/matching/scheduler&type=check_matching&nickname=foo
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    getEnv();
  } catch (e) {
    console.error('[proxy] server_misconfigured', e);
    res.status(500).json({ error: 'server_misconfigured' });
    return;
  }

  if (!verifyOrigin(req, res)) return;
  if (!(await requireAuth(req, res))) return;

  const method = (req.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const sessionToken = readSessionToken(req) ?? '';
  const sessionKey =
    'session:' +
    crypto.createHash('sha256').update(sessionToken).digest('hex').slice(0, 16);
  const limit = rateLimit(sessionKey, 600, 60);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSec));
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  // 백엔드 path는 _p 쿼리 파라미터로 전달됨 (앞에 /admin/...).
  const rawP = req.query._p;
  const path = Array.isArray(rawP) ? rawP[0] : rawP;
  if (typeof path !== 'string' || !path) {
    res.status(400).json({ error: 'missing_path' });
    return;
  }
  if (!/^\/[A-Za-z0-9/_.\-]+$/.test(path)) {
    res.status(400).json({ error: 'invalid_path' });
    return;
  }

  const entry = matchAllowlist(method, path);
  if (!entry) {
    res.status(403).json({ error: 'path_not_allowed' });
    return;
  }

  if (entry.dangerous) {
    const confirmToken =
      (req.headers['x-confirm-token'] as string | undefined) ?? '';
    const ok = await verifyConfirm(confirmToken, entry.action);
    if (!ok) {
      res.status(400).json({ error: 'confirm_required' });
      return;
    }
  }

  // _env: 환경 선택 (test / prod)
  const rawEnv = req.query._env;
  const env = Array.isArray(rawEnv) ? rawEnv[0] : rawEnv;

  // _p, _env 외의 query 파라미터들을 backend로 forward
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k === '_p' || k === '_env') continue;
    if (Array.isArray(v)) {
      for (const x of v) query.append(k, x);
    } else if (typeof v === 'string') {
      query.append(k, v);
    }
  }

  let body: string | null = null;
  if (method === 'POST') {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  }

  try {
    const upstream = await callBackend(method, path, query, body, env, entry.baseUrl);
    res.setHeader('Content-Type', upstream.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.status).send(upstream.body);
  } catch (e) {
    console.error('[proxy] upstream_unreachable', e);
    res.status(502).json({ error: 'upstream_unreachable' });
  }
}
