import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Hardcoded para garantir conexão no Easypanel
        destination: 'https://agenciaia-plataforma-cliente.hjqwkc.easypanel.host/api/:path*',
      },
    ];
  },
};

export default nextConfig;
