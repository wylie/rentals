/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable basePath for development to fix email confirmation links
  // Uncomment these lines for production deployment to GitHub Pages:
  // output: 'export',
  // basePath: '/rentals',
  // assetPrefix: '/rentals',
  // trailingSlash: true,
  images: {
    unoptimized: true
  },
  typescript: {
    // Skip TypeScript checking during build
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
