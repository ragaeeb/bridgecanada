import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: { turbopackUseSystemTlsCerts: true },
    images: { unoptimized: true },
    reactStrictMode: true,
    trailingSlash: true,
    typedRoutes: true,
};

export default nextConfig;
