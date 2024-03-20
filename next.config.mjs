/** @type {import('next').NextConfig} */
const basePath = '/mdiary';
const nextConfig = {
  reactStrictMode: true,
  basePath: basePath,
  env: {
    BASE_PATH: basePath,
  }
};

export default nextConfig;
