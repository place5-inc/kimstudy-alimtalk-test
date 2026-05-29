import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnv } from '../_lib/env.js';
import { clearSessionCookie } from '../_lib/session.js';
import { verifyOrigin } from '../_lib/csrf.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    getEnv();
  } catch (e) {
    console.error('[auth/logout] server_misconfigured', e);
    res.status(500).json({ error: 'server_misconfigured' });
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!verifyOrigin(req, res)) return;

  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
