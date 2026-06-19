import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Mặc định chỉ chạy unit test (an toàn, không chạm DB).
    // Integration test (chạm DB) chạy riêng qua `npm run test:integration`.
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    // Integration test (chạm DB) cần biến môi trường — nạp từ .env
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**", "app/api/**"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
