import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
