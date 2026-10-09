import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@coral-xyz/anchor"],
  turbopack: {},
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    
    // Ensure @ alias points to current directory
    if (!config.resolve.alias) config.resolve.alias = {};
    config.resolve.alias['@'] = `${__dirname}`;
    
    return config;
  },
};

export default nextConfig;
