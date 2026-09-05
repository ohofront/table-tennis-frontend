/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.BACKEND_API_URL || "https://table-tennis-api-production.up.railway.app"}/api/v1/:path*`,
      },
    ];
  },
};
export default nextConfig;
