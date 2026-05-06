/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep workspace packages transpiled by Next so internal `@tasheen/*` source
  // files compile through the same toolchain.
  transpilePackages: [
    "@tasheen/ui",
    "@tasheen/api-client",
    "@tasheen/validation",
    "@tasheen/types",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Add your CDN / S3 / Cloudinary domains here.
      // { protocol: "https", hostname: "cdn.tasheen.com" },
    ],
  },
  experimental: {
     
    typedRoutes: false,
  },
};

export default nextConfig;
