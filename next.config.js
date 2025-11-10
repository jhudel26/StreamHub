/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { 
      allowedOrigins: ['localhost:3000'] 
    }
  },
  output: 'standalone',
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
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'www.hbo.com',
      }
    ],
  },
  webpack: (config) => {
    // Add Prisma client to the webpack externals to prevent build errors
    config.externals = [...(config.externals || []), { '@prisma/client': '@prisma/client' }];
    return config;
  }
};

module.exports = nextConfig;