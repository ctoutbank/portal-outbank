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
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Aumentar para 10MB como margem de segurança
    },
  },
  serverActions: {
    bodySizeLimit: 10485760, // 10MB em bytes (backup caso experimental não funcione)
  },
};



export default nextConfig;
