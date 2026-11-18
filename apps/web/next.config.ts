import type { NextConfig } from "next";
import "./src/lib/env"; // validate environment variables at build and server start
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Compile our internal TypeScript packages (they ship .ts source, not built JS).
  transpilePackages: ["@vch/shared"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
