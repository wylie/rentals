/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/rentals',
  assetPrefix: '/rentals',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  typescript: {
    // Skip TypeScript checking during build
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
