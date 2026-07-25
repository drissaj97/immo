import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  staticPageGenerationTimeout: 180,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "holdingimmo.com" },
      { protocol: "https", hostname: "www.semsarai.ma" },
      { protocol: "https", hostname: "www.mubawab-media.com" },
      { protocol: "https", hostname: "www.mubawab.ma" },
      { protocol: "https", hostname: "content.avito.ma" },
      { protocol: "https", hostname: "www.avito.ma" },
      { protocol: "https", hostname: "sarouty-prod.s3.eu-west-3.amazonaws.com" },
      { protocol: "https", hostname: "i0.wp.com" },
      { protocol: "https", hostname: "medias.yakeey.com" },
      { protocol: "https", hostname: "yakeey.com" },
      { protocol: "https", hostname: "agenz.ma" },
      { protocol: "https", hostname: "media.agenz-failed.ma" },
      { protocol: "https", hostname: "www.cap-property.com" },
      { protocol: "https", hostname: "pub-bc0f3ba210da4c89953c1aa5e465d5e1.r2.dev" },
    ],
  },
};

export default nextConfig;
