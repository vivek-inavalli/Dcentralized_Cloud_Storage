/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    serverActions: { allowedOrigins: ["localhost"] },
  },
};
export default nextConfig;
