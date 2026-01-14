import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

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
    // Formatos modernos de imagem para melhor compressao
    formats: ['image/avif', 'image/webp'],
    // Cache de imagens por 24h
    minimumCacheTTL: 60 * 60 * 24,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Tree shaking automatico para pacotes grandes
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', '@radix-ui/react-icons'],
  },
  // Compressao habilitada
  compress: true,
  // Headers de cache para assets estaticos
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
