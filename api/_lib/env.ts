import { z } from 'zod';

const envSchema = z.object({
  ADMIN_PW_HASH: z.string().min(20, 'ADMIN_PW_HASH 누락 또는 너무 짧음'),
  PW_VERSION: z.coerce.number().int().min(1),
  JWT_SIGNING_SECRET: z.string().min(32, 'JWT_SIGNING_SECRET은 32자 이상이어야 함'),
  BACKEND_SHARED_SECRET: z.string().min(32, 'BACKEND_SHARED_SECRET은 32자 이상이어야 함'),
  AZURE_API_BASE: z.string().url(),
  SESSION_COOKIE_NAME: z.string().min(1).default('ka_admin_sid'),
  ALLOWED_ORIGIN: z.string().url(),
  NODE_ENV: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`환경변수 검증 실패: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}
