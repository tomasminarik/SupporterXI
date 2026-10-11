import { NextResponse, type NextRequest } from 'next/server';
import { posthogHosts, proxyPath } from './analytics/analytics';

// Usage tracking goes through our own domain to PostHog's EU servers (src/analytics/analytics.ts).
// A browser attaches this site's cookies to every request for the site, the backoffice session included,
// so credentials are removed here before the request leaves for PostHog.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.slice(proxyPath.length);
  const headers = new Headers(request.headers);
  headers.delete('cookie');
  headers.delete('authorization');
  // The address is assembled on a PostHog host, so no path a visitor sends can name another destination.
  const destination = new URL(path.startsWith('/static/') ? posthogHosts.assets : posthogHosts.ingest);
  destination.pathname = path;
  destination.search = request.nextUrl.search;
  return NextResponse.rewrite(destination, { request: { headers } });
}

// Next.js reads this at build time, so the path is written out; tests/unit/analytics.test.ts ties it to proxyPath.
export const config = { matcher: '/sxi/:path*' };
