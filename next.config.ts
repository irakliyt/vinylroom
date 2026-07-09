import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Wix hosts this as a static Site — export a fully static build to `out/`.
  // Live Wix Events data is fetched at build time and baked into the HTML
  // (re-run `wix release` to refresh); booking + member auth stay client-side.
  output: "export",
  // Wix static hosting strips trailing slashes, which 504s folder-style routes.
  // Export flat files (thank-you.html) so bare paths resolve.
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;
