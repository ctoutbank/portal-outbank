import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["img.clerk.com", 'file-upload-outbank.s3.amazonaws.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, X-File-Name, Cache-Control, Pragma, Expires, Last-Modified, If-Modified-Since, If-Unmodified-Since, If-None-Match, If-Match, X-Clerk-Auth-Reason, X-Clerk-Auth-Status, X-Clerk-Debug, X-Clerk-SDK-Version",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Expose-Headers",
            value: "X-Clerk-Auth-Reason, X-Clerk-Auth-Status, X-Clerk-Debug",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
