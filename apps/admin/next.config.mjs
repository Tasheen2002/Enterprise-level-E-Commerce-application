/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@tasheen/ui",
    "@tasheen/api-client",
    "@tasheen/validation",
    "@tasheen/types",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  experimental: {
    typedRoutes: true,
    optimizePackageImports: [
      "lucide-react",
      "@tasheen/ui",
      "sonner",
    ],
  },
};


export default nextConfig;
