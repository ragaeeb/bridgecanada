import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        unoptimized: true, // Disable server-based image optimization. Next.js does not support dynamic features with static exports
    },
    output: 'export', // enables static exports which is needed for GitHub Pages
    trailingSlash: true,
};

export default nextConfig;
