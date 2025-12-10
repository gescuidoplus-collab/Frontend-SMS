/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimizaciones para el build
  // Configuración para ignorar errores en producción
  webpack: (config, { dev, isServer }) => {
    // Sólo ignorar errores en producción
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      }
    }
    return config
  }
};

module.exports = nextConfig;
