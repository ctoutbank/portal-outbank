/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignorar os erros de ESLint durante o build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar erros de TypeScript durante o build
    ignoreBuildErrors: true,
  },
  // Configurações para usar o App Router apenas
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig; 