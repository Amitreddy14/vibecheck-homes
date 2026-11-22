import type { NextConfig } from "next";
import { env } from "./src/lib/env"; // validates environment variables at build and server start
import { buildSecurityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Compile our internal TypeScript packages (they ship .ts source, not built JS).
  transpilePackages: ["@vch/shared"],
  async headers() {
    return [{ source: "/:path*", headers: buildSecurityHeaders(env.NEXT_PUBLIC_SUPABASE_URL) }];
  },
};

export default nextConfig;
