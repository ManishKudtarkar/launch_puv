import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (Next.js 15 default dev bundler) — no extra root config needed;
  // removing the `root` override avoids unnecessary filesystem traversal.
  experimental: {
    // Tree-shake large icon/component packages at compile time so only the
    // icons actually used are bundled, speeding up HMR and initial page load.
    optimizePackageImports: [
      "lucide-react",
      "@squircle-js/react",
      "framer-motion",
    ],
  },
};

export default nextConfig;
