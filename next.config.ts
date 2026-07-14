import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    cpus: 2,
    webpackBuildWorker: true,
  },
};

export default nextConfig;
