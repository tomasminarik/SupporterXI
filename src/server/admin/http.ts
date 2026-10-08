import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { adminConfig, authorizedWrite, readSession, sessionCookie } from './security';
import { AdminError } from './github';

export const adminJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'CDN-Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer' } });
export function authorize(request: NextRequest, write = false) {
  const config = adminConfig();
  if (!config) throw new AdminError(503, 'Admin integration is not configured for this deployment.');
  const session = readSession(request.cookies.get(sessionCookie)?.value, config);
  if (!session) throw new AdminError(401, 'Sign in as the administrator.');
  if (new URL(request.url).origin !== config.origin) throw new AdminError(403, 'Admin origin does not match.');
  if (write && !authorizedWrite(request.headers, config, session.csrf)) throw new AdminError(403, 'Invalid request origin or session token. Reload and retry.');
  return { config, session };
}
export async function readBody(request: NextRequest) {
  // Bound streamed input as well as Content-Length (which clients can omit).
  const reader = request.body?.getReader(); if (!reader) throw new AdminError(400, 'Missing request body.');
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength; if (size > 16_384) { await reader.cancel(); throw new AdminError(413, 'Request is too large.'); } chunks.push(chunk.value); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AdminError(400, 'Invalid JSON.'); }
}
export function adminFailure(error: unknown) {
  if (error instanceof AdminError) return adminJson({ error: error.message }, error.status);
  if (error instanceof ZodError) return adminJson({ error: 'Invalid fields. Check names, numbers, references and kickoff timezone.' }, 400);
  // Do not log or return upstream response bodies/tokens.
  return adminJson({ error: 'Could not complete this change. Check the form and retry; your edits are still here.' }, 400);
}
