import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // PDFKit resolves its built-in AFM font metrics from its package directory.
  // Keep it as a Node.js runtime dependency instead of bundling those paths.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
