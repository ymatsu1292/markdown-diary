/** @type {import('next').NextConfig} */
const basePath = '/mdiary';
const nextConfig = {
  reactStrictMode: true,
  basePath: basePath,
  env: {
    BASE_PATH: basePath,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ]
      }
    ]
  },
};

export default nextConfig;
