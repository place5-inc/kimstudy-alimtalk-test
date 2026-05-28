import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnv } from '../_lib/env.js';
import { requireAuth, readSessionToken } from '../_lib/session.js';
import { verifyOrigin } from '../_lib/csrf.js';
import { matchAllowlist } from '../_lib/allowlist.js';
import { verifyConfirm } from '../_lib/jwt.js';
import { callBackend } from '../_lib/backend.js';
import { rateLimit } from '../_lib/ratelimit.js';
import crypto from 'node:crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    getEnv();
  } catch (e) {
    res.status(500).json({ error: 'server_misconfigured', detail: String(e) });
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

  const segments = ([] as string[]).concat(
    (req.query.path as string[] | string | undefined) ?? [],
  );
  const path = '/' + segments.join('/');
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

  const incomingUrl = new URL(req.url ?? '/', 'http://localhost');
  const query = new URLSearchParams();
  for (const [k, v] of incomingUrl.searchParams) {
    if (Array.isArray(v)) {
      for (const x of v) query.append(k, x);
    } else {
      query.append(k, v);
    }
  }

  let body: string | null = null;
  if (method === 'POST') {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  }

  try {
    const upstream = await callBackend(method, path, query, body);
    res.setHeader('Content-Type', upstream.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.status).send(upstream.body);
  } catch (e) {
    res.status(502).json({ error: 'upstream_unreachable', detail: String(e) });
  }
}
