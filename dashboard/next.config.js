/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hardening: isolate Next build cache/output by runtime mode or launcher.
  // Use NEXT_DIST_DIR (set by stable PowerShell launcher) to prevent
  // .next collisions between concurrent dev/start/build workflows.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  trailingSlash: false, // Fixed: No redirect for trailing slashes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
