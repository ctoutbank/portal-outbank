import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['file-upload-outbank.s3.amazonaws.com'],
  },
};

module.exports = {

   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',  // mantenha vazio se não usa porta especial
        pathname: '/**',
      }
    ]
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, ..." },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};


export default nextConfig;
