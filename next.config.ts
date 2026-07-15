import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Wix hosts this as a static Site — export a fully static build to `out/`.
  // Live Wix Events data is fetched at build time and baked into the HTML
  // (re-run `wix release` to refresh); booking + member auth stay client-side.
  output: "export",
  // Export flat files (thank-you.html). A postbuild script mirrors key pages
  // into folder indexes too, so both `/pricing.html` and `/pricing` can be
  // served by Wix static hosting without a client-side redirect.
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;
