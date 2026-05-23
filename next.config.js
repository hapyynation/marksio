/** @type {import('next').NextConfig} */

// Corporate network SSL bypass (needed on networks with SSL inspection)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
