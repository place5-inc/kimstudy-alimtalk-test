import bcrypt from 'bcryptjs';
import { getEnv } from './env.js';

export async function verifyPassword(plain: string): Promise<boolean> {
  const { ADMIN_PW_HASH } = getEnv();
  if (!plain) return false;
  try {
    return await bcrypt.compare(plain, ADMIN_PW_HASH);
  } catch {
    return false;
  }
}
