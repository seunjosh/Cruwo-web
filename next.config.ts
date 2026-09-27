import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://d3nmiuqokrgidx.cloudfront.net/:path*",
      },
    ];
  },
};

export default nextConfig;
