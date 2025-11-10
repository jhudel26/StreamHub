/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] }
  },
  output: 'standalone',
  serverExternalPackages: ['@prisma/client'],
  // Disable static optimization for API routes
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 's.gravatar.com',
      },
    ],
  },
  compiler: {
    styledComponents: true,
  },
  webpack(config) {
    return config;
  },
  // Add empty turbopack config to suppress warning
  turbopack: {},
};

module.exports = nextConfig;