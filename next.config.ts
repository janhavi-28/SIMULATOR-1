import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: process.cwd(),
  experimental: {
    serverComponentsHmrCache: true,
  },
  // Avoid ESLint "Plugin '' not found" during build when using flat config with eslint-config-next
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
