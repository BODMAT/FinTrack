import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  basePath: "/FinTrack",
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/FinTrack",
        basePath: false,
        permanent: false,
      },
      {
        source: "/api/auth/:path*",
        destination: "/FinTrack/api/auth/:path*",
        basePath: false,
        permanent: false,
      },
    ];
  },
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      resourceQuery: /react/,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default nextConfig;
