/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['iili.io', 'freeimage.host'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iili.io',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'freeimage.host',
        pathname: '**',
      }
    ],
  },
}

export default nextConfig;

