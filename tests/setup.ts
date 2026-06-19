// Nạp biến môi trường cho test (DB, secret JWT...). Tự động dùng cho mọi test.
import "dotenv/config";

// Secret mặc định cho unit test token nếu .env chưa đặt — KHÔNG dùng ở production.
process.env.ACCESS_TOKEN_SECRET    ??= "test-access-secret-please-change";
process.env.REFRESH_TOKEN_SECRET   ??= "test-refresh-secret-please-change";
process.env.VIDEO_TOKEN_SECRET     ??= "test-video-secret-please-change";
process.env.ACCESS_TOKEN_EXPIRES_IN  ??= "900";
process.env.REFRESH_TOKEN_EXPIRES_IN ??= "604800";
