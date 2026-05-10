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
      { protocol: "https", hostname: "ik.imagekit.io" },
    ],
    // ImageKit-served assets rarely change; keep optimized variants in the
    // Next image cache for a year so subsequent visits skip re-encoding.
    minimumCacheTTL: 31_536_000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
  experimental: {
    typedRoutes: false,
    // Auto-rewrites barrel imports of these packages to per-symbol imports
    // so unused icons / utilities are tree-shaken in dev and prod. Saves
    // ~30-60 KB per route that imports lucide-react.
    optimizePackageImports: [
      "lucide-react",
      "@tasheen/ui",
      "sonner",
      "date-fns",
      "react-hook-form",
    ],
  },
};

export default nextConfig;
