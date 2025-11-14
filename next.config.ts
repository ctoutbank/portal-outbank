import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'file-upload-outbank.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'file-upload-outbank.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'file-upload-outbank-new.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'file-upload-outbank-new.s3.us-east-1.amazonaws.com',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};



export default nextConfig;
