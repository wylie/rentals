/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for GitHub Pages deployment
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/rentals' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/rentals' : '',
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
