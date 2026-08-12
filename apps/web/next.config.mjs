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
};

export default withNextIntl(nextConfig);
