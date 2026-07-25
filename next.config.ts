import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "holdingimmo.com" },
      { protocol: "https", hostname: "www.semsarai.ma" },
      { protocol: "https", hostname: "www.mubawab-media.com" },
      { protocol: "https", hostname: "pub-bc0f3ba210da4c89953c1aa5e465d5e1.r2.dev" },
    ],
  },
};

export default nextConfig;
