/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/training-hamza' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/training-hamza/' : '',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  // Skip static generation for dynamic routes - they'll be handled client-side
  // via the 404.html SPA fallback
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
