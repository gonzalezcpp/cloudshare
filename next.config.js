/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['archiver'],
  },
};

module.exports = nextConfig;