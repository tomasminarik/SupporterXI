import { NextRequest } from 'next/server';
import { adminFailure, adminJson, authorize } from '../../../../server/admin/http';
import { refreshFixtures } from '../../../../server/fixture-import';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const { config } = authorize(request, true);
    return adminJson(await refreshFixtures(config.token, process.env.FOOTBALL_DATA_TOKEN ?? ''));
  } catch (error) { return adminFailure(error); }
}
