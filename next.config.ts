import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Preserve the repository's user-owned AGENTS.md during local development.
  agentRules: false,
  async headers() {
    return ['/admin/:path*', '/api/admin/:path*'].map((source) => ({ source, headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Robots-Tag', value: 'noindex' },
    ] }));
  },
};

export default nextConfig;
