/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
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
