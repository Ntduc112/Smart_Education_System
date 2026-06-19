import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Cấu hình riêng cho integration test (chạm DB thật).
// Chạy có chủ đích: npm run test:integration
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    setupFiles: ["tests/setup.ts"],
    // DB call có thể chậm hơn; nới timeout và chạy tuần tự tránh đụng dữ liệu
    testTimeout: 20_000,
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
