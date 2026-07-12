# Kiểm thử & Đo hiệu năng

Tài liệu ghi lại chiến lược kiểm thử và kết quả đo hiệu năng của hệ thống.

## 1. Chiến lược kiểm thử

Hệ thống áp dụng mô hình kim tự tháp kiểm thử 3 tầng:

| Tầng | Công cụ | Vị trí | Lệnh chạy | Số lượng |
|---|---|---|---|---|
| Unit test | Vitest 4 | `tests/unit/` | `npm test` | 13 file / 46 test |
| Integration test (chạm DB thật) | Vitest 4, chạy tuần tự | `tests/integration/` | `npm run test:integration` | luồng xác thực end-to-end với Postgres |
| E2E test | Playwright | `e2e/` | `npm run test:e2e` | 5 spec: auth, student, teacher, admin-payment, assistant |

- Unit test phủ phần lõi nghiệp vụ: ký/verify JWT, hash mật khẩu, chấm quiz (trắc nghiệm + coding), quyền truy cập khóa học, soft-delete quiz, engagement.
- Coverage đo bằng `npm run test:coverage`, scope vào `lib/**` và `app/api/**` (phần logic server, bỏ qua UI).
- Integration test tự tạo và tự dọn dữ liệu (email prefix `__test__`), an toàn khi chạy trên DB dev.

### CI (GitHub Actions)

Workflow `.github/workflows/ci.yml` chạy mỗi lần push/PR vào `main`:

1. **Job `test`**: lint (non-blocking) → unit test → dựng Postgres 16 service → `prisma migrate deploy` → integration test.
2. **Job `build`**: production build với Postgres service, xác nhận app build được từ mã nguồn sạch.

Toàn bộ secret trong CI là giá trị giả — CI không chạm hạ tầng thật.

## 2. Kết quả đo hiệu năng

Đo ngày **2026-07-12** trên bản **production build** (`npm run build && npm start`, port 3030), máy dev Linux, database Neon PostgreSQL (region ap-southeast-1 — độ trễ mạng tới DB tính vào kết quả, giống điều kiện production trên Vercel).

### 2.1. Lighthouse (frontend — Core Web Vitals)

Chrome headless, cấu hình mặc định của Lighthouse (mô phỏng mobile + mạng chậm slow-4G, tức là điều kiện xấu hơn nhiều so với người dùng desktop thực tế).

| Trang | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| `/` (landing) | 60 | 89 | 96 | 100 | 2.0 s | 5.4 s | 690 ms | 0 |
| `/courses` | 74 | 84 | 96 | 100 | 1.7 s | 5.1 s | 270 ms | 0 |
| `/login` | 61 | 90 | 100 | 100 | 1.8 s | 5.3 s | 720 ms | 0 |

Nhận xét:
- **CLS = 0** trên cả 3 trang — layout ổn định tuyệt đối, không giật khi tải.
- SEO 100, Best Practices 96–100.
- Điểm Performance bị kéo xuống bởi **LCP ~5s dưới mạng mô phỏng slow-4G** — nguyên nhân chính là bundle JS của landing page (animation GSAP/Framer Motion) và ảnh hero. Trên desktop/mạng thường, trang tải nhanh (xem TTFB ở mục 2.2: trang chủ trả về trong ~29 ms).
- Hướng cải thiện nếu cần: lazy-load section animation dưới màn hình đầu, nén/resize ảnh hero, `next/image` với `priority` cho ảnh LCP.

### 2.2. Load test HTTP (autocannon)

`autocannon -c 20 -d 10` (20 kết nối đồng thời, 10 giây) trên production build:

| Endpoint | Loại | Req/s (avg) | Latency p50 | p97.5 | p99 | Lỗi |
|---|---|---|---|---|---|---|
| `/` | Trang static (prerender) | **606** | 29 ms | 63 ms | 82 ms | 0 |
| `/courses` | Trang SSR + query DB | 47.8 | 381 ms | 1 097 ms | 1 202 ms | 0 |
| `/api/courses` | REST API + query DB | 52.1 | 364 ms | 638 ms | 708 ms | 0 |

Nhận xét:
- Trang static đạt **~600 req/s** với p99 dưới 100 ms — Next.js phục vụ nội dung prerender rất nhanh.
- Các endpoint chạm DB đạt ~50 req/s với 20 kết nối đồng thời, **không có request lỗi**. Nút cổ chai là round-trip tới Neon (DB đặt ở Singapore); p50 ~370 ms chủ yếu là network + query time.
- Với quy mô lớp học (vài trăm người dùng đồng thời, phần lớn request là nội dung tĩnh/cache), throughput này đáp ứng thoải mái.

### 2.3. Benchmark truy vấn DB (Prisma)

`npx tsx scripts/benchmark.ts` — mỗi truy vấn warmup 3 lần, đo 30 lần, dữ liệu mẫu: khóa học 200 học viên, 5 bài học, 5 quiz:

| Truy vấn | min | avg | p95 | max |
|---|---|---|---|---|
| Liệt kê khóa học (browse, 12 items) | 91.9 ms | 101.2 ms | 103.8 ms | 137.5 ms |
| Phân tích tương tác (engagement aggregation) | 207.5 ms | 227.9 ms | 282.4 ms | 375.3 ms |
| Tiến độ học viên — **BULK, 2 query (đang dùng)** | 103.4 ms | 119.3 ms | 172.1 ms | 175.0 ms |
| Tiến độ học viên — N+1 (200 học viên × 2 query, đối chứng) | 19 371 ms | 20 287 ms | 21 558 ms | 21 558 ms |

Nhận xét: cách truy vấn bulk đang dùng **nhanh hơn ~170 lần** so với anti-pattern N+1 (119 ms so với 20.3 s) — minh chứng cho quyết định gom truy vấn khi tính tiến độ học viên.

## 3. Cách tái lập phép đo

```bash
# 1. Build production và chạy
npm run build && npm start   # http://localhost:3030

# 2. Load test (terminal khác)
npx autocannon -c 20 -d 10 http://localhost:3030/api/courses

# 3. Lighthouse
npx lighthouse http://localhost:3030/ \
  --chrome-flags="--headless=new" \
  --only-categories=performance,accessibility,best-practices,seo \
  --view

# 4. Benchmark truy vấn DB
npx tsx scripts/benchmark.ts
```

Lưu ý: luôn đo trên `npm start` (production build). Bản `npm run dev` chậm hơn nhiều lần, số liệu không có ý nghĩa.
