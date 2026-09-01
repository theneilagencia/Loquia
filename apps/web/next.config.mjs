import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@loquia/ui',
    '@loquia/domain',
    '@loquia/contracts',
    '@loquia/export-engine',
    '@loquia/i18n',
  ],
  experimental: {
    typedRoutes: false,
  },
  // sharp is not built in this environment; serve images without the optimizer.
  images: {
    unoptimized: true,
  },
  // Same-origin proxy: the browser calls /api/* on this site, and Next forwards
  // it to the real API. This keeps the session cookie first-party to the site so
  // login works on mobile Safari/iOS (which blocks cross-site cookies). The
  // Deepgram webhook still hits the API directly via PUBLIC_API_URL.
  async rewrites() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};

export default withNextIntl(nextConfig);
