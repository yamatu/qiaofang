import type { NextConfig } from "next";

const noStoreHeaders = [
  { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
  { key: 'CDN-Cache-Control', value: 'no-store' },
  { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/',
        headers: noStoreHeaders,
      },
      {
        source: '/about',
        headers: noStoreHeaders,
      },
      {
        source: '/products',
        headers: noStoreHeaders,
      },
      {
        source: '/products/:path*',
        headers: noStoreHeaders,
      },
      {
        source: '/certificates',
        headers: noStoreHeaders,
      },
      {
        source: '/news',
        headers: noStoreHeaders,
      },
      {
        source: '/news/:path*',
        headers: noStoreHeaders,
      },
      {
        source: '/contact',
        headers: noStoreHeaders,
      },
      {
        source: '/admin/:path*',
        headers: noStoreHeaders,
      },
      {
        source: '/api/:path*',
        headers: noStoreHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8080' },
      { protocol: 'http', hostname: 'backend', port: '8080' },
    ],
  },
};

export default nextConfig;
