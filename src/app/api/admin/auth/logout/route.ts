import { NextRequest } from 'next/server';
import { adminFailure, adminJson, authorize } from '../../../../../server/admin/http';
import { cookieOptions, sessionCookie } from '../../../../../server/admin/security';
export async function POST(request: NextRequest) {
  try { authorize(request, true); const response = adminJson({ ok: true }); response.cookies.set(sessionCookie, '', { ...cookieOptions, maxAge: 0 }); return response; } catch (error) { return adminFailure(error); }
}
