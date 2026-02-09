import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      { source: "/subjects/physics", destination: "/trending-topics/physics", permanent: true },
      { source: "/subjects/physics/:topic", destination: "/trending-topics/physics/:topic", permanent: true },
      { source: "/miscellaneous/:subject", destination: "/trending-topics/:subject", permanent: true },
    ];
  },
  experimental: {
    serverComponentsHmrCache: true,
  },
  // Avoid ESLint "Plugin '' not found" during build when using flat config with eslint-config-next
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
