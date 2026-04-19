import type { NextConfig } from "next";

const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Туннели: иначе dev-сервер блокирует запросы с чужого Host
  allowedDevOrigins: ["*.loca.lt", "*.trycloudflare.com"],
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${api}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
