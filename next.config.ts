import type { NextConfig } from 'next';
import { posthogHosts, proxyPath } from './src/analytics/analytics';

const noindex = { key: 'X-Robots-Tag', value: 'noindex, nofollow' };
const adminHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  noindex,
];

const nextConfig: NextConfig = {
  // Preserve the repository's user-owned AGENTS.md during local development.
  agentRules: false,
  // Usage tracking goes through our own domain to PostHog's EU servers (src/analytics/analytics.ts).
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: `${proxyPath}/static/:path*`, destination: `${posthogHosts.assets}/static/:path*` },
      { source: `${proxyPath}/:path*`, destination: `${posthogHosts.ingest}/:path*` },
    ];
  },
  async headers() {
    return [
      ...['/gaffer', '/gaffer/:path*', '/api/admin/:path*'].map((source) => ({ source, headers: adminHeaders })),
      // Pages that are public but never indexed. The header is what keeps them out: robots.txt does not list
      // them, because a crawler that may not fetch a page never reads its noindex.
      ...['/gameplan', '/dev/:path*'].map((source) => ({ source, headers: [noindex] })),
      // The vercel.app address serves the same build as supporterxi.com; only the public address is indexed.
      { source: '/:path*', has: [{ type: 'host' as const, value: '(?<host>.*\\.vercel\\.app)' }], headers: [noindex] },
    ];
  },
};

export default nextConfig;
