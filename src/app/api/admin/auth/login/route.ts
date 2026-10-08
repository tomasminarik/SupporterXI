import { NextRequest, NextResponse } from 'next/server';
import { adminConfig, cookieOptions, flowCookie, nonce, pkceChallenge, seal } from '../../../../../server/admin/security';
import { adminJson } from '../../../../../server/admin/http';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const config = adminConfig();
  if (!config) return adminJson({ error: 'Admin integration is not configured for this deployment.' }, 503);
  if (request.nextUrl.origin !== config.origin) return adminJson({ error: 'Use the configured admin origin.' }, 403);
  const state = nonce(); const verifier = nonce();
  const url = new URL('https://github.com/login/oauth/authorize');
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: `${config.origin}/api/admin/auth/callback`, scope: 'read:user', state, code_challenge: pkceChallenge(verifier), code_challenge_method: 'S256', allow_signup: 'false' }).toString();
  const response = NextResponse.redirect(url);
  response.headers.set('Cache-Control', 'no-store'); response.headers.set('Referrer-Policy', 'no-referrer');
  response.cookies.set(flowCookie, seal({ kind: 'oauth', state, verifier, exp: Date.now() + 600_000 }, config), { ...cookieOptions, maxAge: 600 });
  return response;
}
