import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["shared"],
  outputFileTracingRoot: __dirname,
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
