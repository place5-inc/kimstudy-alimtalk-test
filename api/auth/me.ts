import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnv } from '../_lib/env.js';
import { verifySession } from '../_lib/jwt.js';
import { readSessionToken } from '../_lib/session.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    getEnv();
  } catch (e) {
    console.error('[auth/me] server_misconfigured', e);
    res.status(500).json({ error: 'server_misconfigured' });
    return;
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const token = readSessionToken(req);
  if (!token) {
    res.status(401).json({ authenticated: false });
    return;
  }
  const claims = await verifySession(token);
  if (!claims) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ authenticated: true });
}
