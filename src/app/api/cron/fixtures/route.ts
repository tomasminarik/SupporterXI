import { NextRequest } from 'next/server';
import { adminFailure, adminJson } from '../../../../server/admin/http';
import { adminConfig, equal } from '../../../../server/admin/security';
import { AdminError } from '../../../../server/admin/github';
import { refreshFixtures } from '../../../../server/fixture-import';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const config = adminConfig();
    const secret = process.env.CRON_SECRET;
    if (!config || !secret || secret.length < 32 || new URL(request.url).origin !== config.origin || !equal(request.headers.get('authorization') ?? '', `Bearer ${secret}`)) throw new AdminError(401, 'Unauthorized.');
    return adminJson(await refreshFixtures(config.token, process.env.FOOTBALL_DATA_TOKEN ?? ''));
  } catch (error) { return adminFailure(error); }
}
