import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8080' },
      { protocol: 'http', hostname: 'backend', port: '8080' },
    ],
  },
};

export default nextConfig;
