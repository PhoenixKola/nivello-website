import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Two root layouts ((en) and it) exist so each locale emits its own <html lang>;
  // unmatched URLs therefore need a layout-independent 404.
  experimental: {
    globalNotFound: true
  }
}

export default nextConfig