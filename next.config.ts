import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Proxy buffer toàn bộ body trước khi vào route handler.
    // Tăng lên 600MB để đủ cho upload video 500MB.
    proxyClientMaxBodySize: "600mb",
  },
  images: {
    remotePatterns: [
      // MinIO local dev
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      // Cloudflare R2 khi deploy (thay <account-id> bằng id thật)
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
