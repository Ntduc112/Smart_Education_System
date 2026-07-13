import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
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
      // Public R2 development domains used by S3_PUBLIC_URL.
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
};

export default nextConfig;
