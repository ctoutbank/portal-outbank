import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["img.clerk.com", 'file-upload-outbank.s3.amazonaws.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};



export default nextConfig;
