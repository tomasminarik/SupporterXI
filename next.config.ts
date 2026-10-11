import type { NextConfig } from 'next';
const noindex = { key: 'X-Robots-Tag', value: 'noindex, nofollow' };
// Everything the site loads comes from its own address: scripts, styles, fonts, images and the usage
// tracking that src/proxy.ts passes on. The policy keeps it that way if unwanted markup ever reaches a
// page, and stops other sites from framing this one. Inline scripts and styles stay allowed because
// Next.js and Ant Design write them; development needs eval, and a preview carries Vercel's toolbar.
const development = process.env.NODE_ENV === 'development';
const toolbar = process.env.VERCEL_ENV === 'preview' ? ' https://vercel.live' : '';
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ''}${toolbar}`,
  `style-src 'self' 'unsafe-inline'${toolbar}`,
  `img-src 'self' data: blob:${toolbar}`,
  `font-src 'self'${toolbar}`,
  `connect-src 'self'${toolbar}${toolbar && ' wss://ws-us3.pusher.com'}`,
  `frame-src ${toolbar.trim() || "'none'"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');
const siteHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
];
const adminHeaders = [{ key: 'Referrer-Policy', value: 'no-referrer' }, noindex];

const nextConfig: NextConfig = {
  // Preserve the repository's user-owned AGENTS.md during local development.
  agentRules: false,
  poweredByHeader: false,
  // Usage tracking goes through our own domain to PostHog's EU servers (src/proxy.ts), whose addresses
  // end in a slash that must survive.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      { source: '/:path*', headers: siteHeaders },
      // Later entries win for a header they repeat, so the backoffice sends no referrer at all.
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
