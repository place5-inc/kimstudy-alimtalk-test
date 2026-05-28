import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnv } from './env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function verifyOrigin(req: VercelRequest, res: VercelResponse): boolean {
  if (SAFE_METHODS.has((req.method ?? 'GET').toUpperCase())) return true;

  const { ALLOWED_ORIGIN } = getEnv();
  const allowed = new URL(ALLOWED_ORIGIN).origin;

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  let candidate: string | null = null;
  if (typeof origin === 'string' && origin) {
    candidate = origin;
  } else if (typeof referer === 'string' && referer) {
    try {
      candidate = new URL(referer).origin;
    } catch {
      candidate = null;
    }
  }

  if (candidate !== allowed) {
    res.status(403).json({ error: 'invalid_origin' });
    return false;
  }
  return true;
}
