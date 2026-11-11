import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/release-requests',
        destination: '/requests',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
