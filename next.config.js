const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental.optimizePackageImports was removed because it conflicts
  // with next-pwa's precompile pass: the precache manifest references
  // vendor-chunks that get renamed/removed by the optimization, leading
  // to "Cannot find module './vendor-chunks/...'" 500s at runtime.
  // Bundle-size impact is minimal; Next's standard tree-shaking covers it.
};

module.exports = withPWA(nextConfig);
