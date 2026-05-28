import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getEnv } from '../_lib/env.js';
import { verifyPassword } from '../_lib/password.js';
import { signSession } from '../_lib/jwt.js';
import { setSessionCookie } from '../_lib/session.js';
import { getClientIp, rateLimit } from '../_lib/ratelimit.js';
import { verifyOrigin } from '../_lib/csrf.js';

const bodySchema = z.object({
  password: z.string().min(1).max(256),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    getEnv();
  } catch (e) {
    res.status(500).json({ error: 'server_misconfigured', detail: String(e) });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!verifyOrigin(req, res)) return;

  const ip = getClientIp(req);
  const limit = rateLimit(`login:${ip}`, 10, 300);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSec));
    res.status(429).json({ error: 'too_many_attempts', retryAfter: limit.retryAfterSec });
    return;
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    await delay(1000);
    res.status(400).json({ error: 'invalid_input' });
    return;
  }

  const ok = await verifyPassword(parsed.data.password);
  if (!ok) {
    await delay(1000);
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }

  const token = await signSession();
  setSessionCookie(res, token);
  res.status(200).json({ ok: true });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
