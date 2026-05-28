import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnv, isProduction } from './env.js';
import { verifySession } from './jwt.js';

const MAX_AGE_SECONDS = 8 * 60 * 60;

export function setSessionCookie(res: VercelResponse, token: string): void {
  const { SESSION_COOKIE_NAME } = getEnv();
  const flags = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (isProduction()) flags.push('Secure');
  res.setHeader('Set-Cookie', flags.join('; '));
}

export function clearSessionCookie(res: VercelResponse): void {
  const { SESSION_COOKIE_NAME } = getEnv();
  const flags = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (isProduction()) flags.push('Secure');
  res.setHeader('Set-Cookie', flags.join('; '));
}

export function readSessionToken(req: VercelRequest): string | null {
  const { SESSION_COOKIE_NAME } = getEnv();
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parts = raw.split(';').map((s) => s.trim());
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq);
    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(part.slice(eq + 1));
    }
  }
  return null;
}

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  const token = readSessionToken(req);
  if (!token) {
    res.status(401).json({ error: 'unauthenticated' });
    return false;
  }
  const claims = await verifySession(token);
  if (!claims) {
    res.status(401).json({ error: 'unauthenticated' });
    return false;
  }
  return true;
}
