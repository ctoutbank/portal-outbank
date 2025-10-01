import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react']
  },
  
  transpilePackages: ['recharts'],
  
  images: {
    domains: ["img.clerk.com", 'file-upload-outbank.s3.amazonaws.com'],
  },
};

export default nextConfig;
