import { SignJWT, jwtVerify } from 'jose';
import { getEnv } from './env.js';

function key(): Uint8Array {
  return new TextEncoder().encode(getEnv().JWT_SIGNING_SECRET);
}

export interface SessionClaims {
  sub: 'admin';
  pwVersion: number;
  iat: number;
  exp: number;
}

export interface ConfirmClaims {
  sub: 'confirm';
  action: string;
  iat: number;
  exp: number;
}

export async function signSession(): Promise<string> {
  const env = getEnv();
  return await new SignJWT({ pwVersion: env.PW_VERSION })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin')
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    if (payload.sub !== 'admin') return null;
    const env = getEnv();
    if (payload.pwVersion !== env.PW_VERSION) return null;
    return payload as unknown as SessionClaims;
  } catch {
    return null;
  }
}

export async function signConfirm(action: string): Promise<string> {
  return await new SignJWT({ action })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('confirm')
    .setIssuedAt()
    .setExpirationTime('30s')
    .sign(key());
}

export async function verifyConfirm(token: string, expectedAction: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    if (payload.sub !== 'confirm') return false;
    if (payload.action !== expectedAction) return false;
    return true;
  } catch {
    return false;
  }
}
