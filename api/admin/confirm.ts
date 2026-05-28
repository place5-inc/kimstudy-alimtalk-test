import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getEnv } from '../_lib/env.js';
import { requireAuth } from '../_lib/session.js';
import { verifyOrigin } from '../_lib/csrf.js';
import { signConfirm } from '../_lib/jwt.js';
import { isKnownAction } from '../_lib/allowlist.js';

const bodySchema = z.object({
  action: z.string().min(1).max(64),
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
  if (!(await requireAuth(req, res))) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  if (!isKnownAction(parsed.data.action)) {
    res.status(400).json({ error: 'unknown_action' });
    return;
  }

  const token = await signConfirm(parsed.data.action);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ token, expiresIn: 30 });
}
