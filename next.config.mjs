/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  // basePath is injected automatically by actions/configure-pages during CI
};

export default nextConfig;
