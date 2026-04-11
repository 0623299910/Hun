/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // GitHub Pages serves under /Hun — use basePath only in production build
  basePath: isProd ? '/Hun' : '',
  assetPrefix: isProd ? '/Hun/' : '',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
