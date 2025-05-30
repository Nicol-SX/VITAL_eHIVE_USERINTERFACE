/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '2mb'
    }
  },
  // Configure which pages should be static or dynamic
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Ensure API routes are always dynamic
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/hrps-api/:path*',
        destination: 'http://192.168.1.185/hrps-api/:path*'
      }
    ]
  }
}

module.exports = nextConfig 