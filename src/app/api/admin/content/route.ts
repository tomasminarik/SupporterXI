import { NextRequest } from 'next/server';
import { adminFailure, adminJson, authorize, readBody } from '../../../../server/admin/http';
import { readEditor, saveSource } from '../../../../server/admin/github';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try { const { config, session } = authorize(request); return adminJson({ ...await readEditor(config.token, config.origin), csrf: session.csrf }); } catch (error) { return adminFailure(error); }
}
export async function POST(request: NextRequest) {
  try { const { config } = authorize(request, true); return adminJson(await saveSource(await readBody(request), config.token)); } catch (error) { return adminFailure(error); }
}
