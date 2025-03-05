import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    basePath: '/bridgecanada', // we need this since GitHub pages will put all assets in a folder: ragaeeb.github.io/bridgecanada/*
    images: {
        unoptimized: true, // Disable server-based image optimization. Next.js does not support dynamic features with static exports
    },
    output: 'export', // enables static exports which is needed for GitHub Pages
};

export default nextConfig;
