import type { NextConfig } from "next";

/**
 * Куда Next (на вашей машине) проксирует `/api/*`.
 */
const djangoProxyTarget =
  process.env.DJANGO_INTERNAL_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Разрешаем работу через туннели для разработки
  allowedDevOrigins: ["*.loca.lt", "*.trycloudflare.com", "*.ngrok-free.app"],

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