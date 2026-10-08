import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminFailure, adminJson, authorize } from '../../../../server/admin/http';
import { publication } from '../../../../server/admin/github';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const { config } = authorize(request);
    const commit = z.string().regex(/^[a-f0-9]{40}$/).parse(request.nextUrl.searchParams.get('commit'));
    const digest = z.string().regex(/^[a-f0-9]{64}$/).parse(request.nextUrl.searchParams.get('digest'));
    return adminJson({ state: await publication(commit, digest, config.token, config.origin) });
  } catch (error) { return adminFailure(error); }
}
