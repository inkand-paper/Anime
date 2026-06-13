import type { NextConfig } from "next";

const SELF = "'self'";
const NONE = "'none'";

const cspHeader = [
  `default-src ${SELF}`,
  `script-src ${SELF} 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://pay.google.com`,
  `style-src ${SELF} 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src ${SELF} https://fonts.gstatic.com`,
  `img-src ${SELF} data: blob: https:`,
  `media-src ${SELF} blob: https:`,
  `frame-src ${SELF} https://kwik.si https://kwik.cx https://kwik.pw https://animepahe.ru https://dood.re https://voe.sx https://filemoon.sx https://streamwish.to https://streamtape.com https://mixdrop.ag https://megastream.cc https://www.paypal.com https://pay.google.com`,
  `connect-src ${SELF} https:`,
  `worker-src ${SELF} blob:`,
  `object-src ${NONE}`,
  `base-uri ${SELF}`,
  `form-action ${SELF}`,
  `frame-ancestors ${NONE}`,
  `upgrade-insecure-requests`,
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,

  turbopack: {
    root: process.cwd(),
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "media.kitsu.io" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",            value: cspHeader.replace(/\n/g, "") },
          { key: "X-Frame-Options",                    value: "DENY" },
          { key: "X-Content-Type-Options",             value: "nosniff" },
          { key: "Referrer-Policy",                    value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",                 value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-XSS-Protection",                   value: "1; mode=block" },
          { key: "Strict-Transport-Security",          value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Cross-Origin-Opener-Policy",         value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy",       value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy",       value: "credentialless" },
        ],
      },
      {
        // Allow embedding from approved streaming hosts
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization,X-Webhook-Secret" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
