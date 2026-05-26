/** @type {import('next').NextConfig} */

// Corporate network SSL bypass (needed on networks with SSL inspection)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Node.js v24 compatibility: limit parallel workers to prevent jest-worker crashes
    workerThreads: false,
    cpus: 1,
  },
}

module.exports = nextConfig
