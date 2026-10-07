import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Preserve the repository's user-owned AGENTS.md during local development.
  agentRules: false,
};

export default nextConfig;
