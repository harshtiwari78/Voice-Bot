import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Disable strict mode for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Remove Azure-specific output configuration for Vercel compatibility
  // output: 'standalone', // Removed for Vercel

  // Webpack configuration for better compatibility
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Simple fallback for missing Next.js internal modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "next/dist/server/route-modules/app-page/vendored/contexts/loadable": false,
    };

    // Ignore missing modules in externals
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "next/dist/server/route-modules/app-page/vendored/contexts/loadable": "{}",
      });
    }

    return config;
  },

  // Security: Block access to uploads directory
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/blocked', // This will return 404
      },
    ];
  },

  // Additional security headers
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, nosnippet, noarchive',
          },
        ],
      },
    ];
  },
};

export default nextConfig;