import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty'],
  },
  webpack: (config) => {
    config.cache = false;

    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      /next-intl[\\/].*Parsing of .*import\(t\)/,
      /A Node\.js API is used \(CompressionStream|DecompressionStream\) which is not supported in the Edge Runtime/,
    ];

    return config;
  },
};

export default withNextIntl(nextConfig);
