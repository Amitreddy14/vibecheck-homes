import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Compile our internal TypeScript packages (they ship .ts source, not built JS).
  transpilePackages: ["@vch/shared"],
};

export default nextConfig;
