import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Куда Next (на вашей машине) проксирует `/api/*`.
 * Нельзя подставлять URL trycloudflare/ngrok — будет петля «сам на себя» и таблица топа не грузится.
 */
const djangoProxyTarget =
  process.env.DJANGO_INTERNAL_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Monorepo: иначе Turbopack резолвит `@import "tailwindcss"` от корня репо, а не от `frontend/`.
  turbopack: {
    root: turbopackRoot,
  },
  // Туннели: иначе dev-сервер блокирует запросы с чужого Host
  allowedDevOrigins: ["*.loca.lt", "*.trycloudflare.com"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${djangoProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
