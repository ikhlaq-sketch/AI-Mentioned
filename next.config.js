/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdfkit', '@sparticuz/chromium'],
  },
};

module.exports = nextConfig;