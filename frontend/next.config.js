/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages
  output: 'export',
  
  images: {
    // Allow images from API domain
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  
  // Environment variables for server-side fetching
  env: {
    // Server-side API URL (not exposed to browser)
    API_BASE_URL: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  
  // Logging for debugging SSR issues
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;
