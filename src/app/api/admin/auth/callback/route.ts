import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminConfig, cookieOptions, equal, flowCookie, flowSchema, nonce, seal, sessionCookie, unseal } from '../../../../../server/admin/security';
import { github } from '../../../../../server/admin/github';
import { adminJson } from '../../../../../server/admin/http';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const config = adminConfig();
  if (!config) return adminJson({ error: 'Admin integration is not configured.' }, 503);
  const response = NextResponse.redirect(`${config.origin}/gaffer?auth=failed`);
  response.headers.set('Cache-Control', 'no-store'); response.headers.set('Referrer-Policy', 'no-referrer');
  response.cookies.set(flowCookie, '', { ...cookieOptions, maxAge: 0 });
  response.cookies.set(sessionCookie, '', { ...cookieOptions, maxAge: 0 });
  try {
    const flow = flowSchema.parse(unseal(request.cookies.get(flowCookie)?.value ?? '', config));
    const code = request.nextUrl.searchParams.get('code');
    if (request.nextUrl.origin !== config.origin || flow.exp <= Date.now() || flow.exp > Date.now() + 600_000 || !equal(request.nextUrl.searchParams.get('state') ?? '', flow.state) || !code || code.length > 512) return response;
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12_000), headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: `${config.origin}/api/admin/auth/callback`, code_verifier: flow.verifier }) });
    if (!tokenResponse.ok) return response;
    const token = z.object({ access_token: z.string().min(1), token_type: z.literal('bearer') }).parse(await tokenResponse.json());
    const user = z.object({ id: z.number().int().positive() }).parse(await github('https://api.github.com/user', token.access_token));
    if (String(user.id) !== config.userId) return response;
    // The OAuth access token is discarded after identity verification, not stored in the browser.
    response.headers.set('Location', `${config.origin}/gaffer`);
    response.cookies.set(sessionCookie, seal({ kind: 'session', userId: String(user.id), csrf: nonce(), exp: Date.now() + 2 * 3600_000 }, config), { ...cookieOptions, maxAge: 7200 });
  } catch { /* Generic failure; never expose provider bodies or credentials. */ }
  return response;
}
