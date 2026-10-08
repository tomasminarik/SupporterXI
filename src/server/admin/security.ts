import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { z } from 'zod';

export const sessionCookie = '__Host-xi-admin';
export const flowCookie = '__Host-xi-oauth';
export const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/' };
export const sessionSchema = z.strictObject({ kind: z.literal('session'), userId: z.string().regex(/^\d+$/), csrf: z.string().min(32), exp: z.number().int() });
export const flowSchema = z.strictObject({ kind: z.literal('oauth'), state: z.string().min(32), verifier: z.string().min(32), exp: z.number().int() });
export type AdminConfig = { origin: string; clientId: string; clientSecret: string; secret: string; userId: string; token: string };
export function adminConfig(env: Record<string, string | undefined> = process.env): AdminConfig | null {
  // Never provision production authority in a preview or unclassified deployment.
  if (env.VERCEL_ENV !== 'production') return null;
  const { ADMIN_ORIGIN: origin, GITHUB_OAUTH_CLIENT_ID: clientId, GITHUB_OAUTH_CLIENT_SECRET: clientSecret, ADMIN_SESSION_SECRET: secret, ADMIN_GITHUB_USER_ID: userId, GITHUB_CONTENT_TOKEN: token } = env;
  if (!origin || !clientId || !clientSecret || !secret || secret.length < 32 || !userId || !/^\d+$/.test(userId) || !token) return null;
  try { const url = new URL(origin); if (url.protocol !== 'https:' || url.origin !== origin) return null; } catch { return null; }
  return { origin, clientId, clientSecret, secret, userId, token };
}
export const nonce = () => randomBytes(32).toString('base64url');
export const pkceChallenge = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');
export function equal(a: string, b: string) { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
export function seal(value: unknown, config: AdminConfig): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(config.secret).digest(), iv);
  cipher.setAAD(Buffer.from(config.origin));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}
export function unseal(value: string, config: AdminConfig): unknown {
  try {
    if (value.length > 4000) return null;
    const bytes = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(config.secret).digest(), bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(config.origin)); decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'));
  } catch { return null; }
}
export function readSession(cookie: string | undefined, config: AdminConfig, now = Date.now()) {
  const result = sessionSchema.safeParse(cookie ? unseal(cookie, config) : null);
  return result.success && result.data.userId === config.userId && result.data.exp > now ? result.data : null;
}
export function authorizedWrite(headers: Headers, config: AdminConfig, csrf: string): boolean {
  return headers.get('origin') === config.origin && headers.get('sec-fetch-site') !== 'cross-site' && equal(headers.get('x-csrf-token') ?? '', csrf) && headers.get('content-type')?.split(';')[0] === 'application/json';
}
