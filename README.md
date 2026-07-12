# Learnust — Smart Education System

Nền tảng học trực tuyến (LMS) xây dựng trên Next.js App Router: quản lý khóa học, bài học video/PDF, quiz & bài tập lập trình chấm tự động, thanh toán PayOS, thống kê cho giảng viên và quản trị viên.

**Vai trò người dùng:** `STUDENT` · `TEACHER` · `TEACHING_ASSISTANT` · `ADMIN`

---

## 1. Công nghệ & thư viện

### Nền tảng

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| [Node.js](https://nodejs.org) | ≥ 20.9 (khuyến nghị 22.x) | Runtime |
| [Next.js](https://nextjs.org) | 16.2.1 | Framework fullstack (App Router, Route Handlers, `proxy.ts`) |
| [React](https://react.dev) | 19.2.4 | UI |
| [TypeScript](https://www.typescriptlang.org) | ^5 | Ngôn ngữ |
| [PostgreSQL](https://www.postgresql.org) | 16 | Cơ sở dữ liệu |
| [Prisma](https://www.prisma.io) | ^7.6.0 (+ `@prisma/adapter-pg`) | ORM, migration, seed |

### Thư viện chính

| Nhóm | Thư viện |
|---|---|
| Xác thực | `jose` ^6 (JWT HS256, access + refresh token qua cookie), `bcryptjs` ^3 (hash mật khẩu) |
| UI / Styling | Tailwind CSS v4, `lucide-react`, `framer-motion` ^12, `gsap` ^3, `sonner` (toast), `nextjs-toploader` |
| Form & validation | `react-hook-form` ^7, `@hookform/resolvers`, Zod |
| Data fetching | `axios` ^1, `@tanstack/react-query` ^5 |
| Biểu đồ | `recharts` ^3 |
| Trình soạn code (quiz lập trình) | CodeMirror 6 (`codemirror`, `@codemirror/lang-{python,cpp,java,javascript}`, theme one-dark) |
| Kéo thả (sắp xếp chương/bài học) | `@dnd-kit/core`, `@dnd-kit/sortable` |
| Lưu trữ file | Cloudflare R2 qua AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) — upload trực tiếp từ trình duyệt bằng presigned URL |
| Thanh toán | PayOS (`@payos/node` ^2) |
| Xử lý video | `fluent-ffmpeg` + `ffmpeg-static` (worker faststart), Groq Whisper (`groq-sdk`) tạo transcript |
| Chấm code | [OneCompiler Code Execution API](https://next.onecompiler.com/apis/code-execution) |
| AI | `@anthropic-ai/sdk`, `groq-sdk` |
| Email | `resend` |
| Test | Vitest ^4 (+ coverage v8), Playwright ^1.60 (E2E), Puppeteer |

---

## 2. Yêu cầu hệ thống

- **Node.js ≥ 20.9** và npm
- **PostgreSQL 16** — chạy bằng Docker (đã có sẵn `docker-compose.yml`) hoặc dùng dịch vụ cloud (Neon, Supabase…)
- **Docker + Docker Compose** (nếu chạy database local)

---

## 3. Cài đặt & chạy

### Bước 1 — Clone và cài dependencies

```bash
git clone <repo-url>
cd Smart_Education_System
npm install
# postinstall tự chạy `prisma generate`
```

### Bước 2 — Khởi động cơ sở dữ liệu

Cách nhanh nhất là dùng Docker Compose (Postgres chạy ở port **5433**, kèm MinIO làm S3 local nếu không dùng Cloudflare R2):

```bash
docker compose up -d
```

Thông tin database mặc định trong `docker-compose.yml`:

| Tham số | Giá trị |
|---|---|
| Host / Port | `localhost:5433` |
| User / Password | `admin` / `password` |
| Database | `smart_education` |

### Bước 3 — Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc (xem chi tiết từng biến ở [mục 4](#4-biến-môi-trường)):

```env
# Database (Docker local — đổi sang connection string Neon/Supabase nếu dùng cloud)
DATABASE_URL="postgresql://admin:password@localhost:5433/smart_education"

# JWT
ACCESS_TOKEN_SECRET=chuoi_bi_mat_ngau_nhien_1
REFRESH_TOKEN_SECRET=chuoi_bi_mat_ngau_nhien_2
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
VIDEO_TOKEN_SECRET=chuoi_bi_mat_ngau_nhien_3

# Storage S3 (Cloudflare R2 hoặc MinIO local từ docker-compose)
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=education-system
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_PUBLIC_URL=https://<public-bucket-url>

# Thanh toán PayOS
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
PAYOS_RETURN_URL=http://localhost:3030/payment/success
PAYOS_CANCEL_URL=http://localhost:3030/payment/cancel

# Chấm bài tập lập trình (OneCompiler)
ONECOMPILER_API_KEY=...
ONECOMPILER_API_URL=https://api.onecompiler.com/v1/run

# Video worker (tùy chọn — xử lý faststart + transcript)
RAILWAY_WORKER_URL=http://localhost:3001
WORKER_SECRET=chuoi_bi_mat_dung_chung_voi_worker
GROQ_API_KEY=...

# Email (tùy chọn — quên mật khẩu, thông báo)
RESEND_API_KEY=...
RESEND_FROM_EMAIL="Learnust <noreply@your-domain.com>"
```

### Bước 4 — Khởi tạo schema và dữ liệu mẫu

```bash
npx prisma migrate dev   # tạo bảng theo migrations trong prisma/migrations/
npx prisma db seed       # chạy prisma/seed.ts — tạo tài khoản + khóa học mẫu
```

> ⚠️ `seed.ts` **xóa toàn bộ dữ liệu cũ** trước khi seed. Chỉ chạy trên database dev.

Các script seed bổ sung (tùy chọn, chạy sau seed chính):

```bash
npx tsx prisma/seed-bulk.ts             # thêm nhiều user/enrollment (additive, không xóa data cũ)
npx tsx prisma/seed-roadmaps.ts         # dữ liệu lộ trình học
npx tsx prisma/seed-posts.ts            # bài viết cộng đồng
npx tsx prisma/seed-quizzes-attempts.ts # lịch sử làm quiz
```

### Bước 5 — Chạy ứng dụng

```bash
npm run dev
```

Mở **http://localhost:3030** (app chạy ở port `3030`, không phải 3000).

Chạy production build:

```bash
npm run build
npm start
```

---

## 4. Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | ✅ | Secret ký JWT (chuỗi ngẫu nhiên bất kỳ, khác nhau) |
| `ACCESS_TOKEN_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` | ✅ | Thời hạn token, ví dụ `15m` / `7d` |
| `VIDEO_TOKEN_SECRET` | ✅ | Secret ký token xem video |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_URL` | ✅ | Lưu trữ file (video, ảnh, PDF). Dùng Cloudflare R2, hoặc MinIO local từ `docker-compose.yml` (endpoint `http://localhost:9002`, key `minioadmin`/`minioadmin123`) |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | ✅* | Cổng thanh toán PayOS (cần để mua khóa học trả phí) |
| `PAYOS_RETURN_URL`, `PAYOS_CANCEL_URL` | ✅* | URL redirect sau thanh toán |
| `ONECOMPILER_API_KEY`, `ONECOMPILER_API_URL` | ✅* | Chấm bài tập lập trình (Python, JavaScript/Node.js, C, C++, Java). Test case gửi theo batch — mỗi lần chấm 1 request. **Không** để lộ key với prefix `NEXT_PUBLIC_` |
| `RAILWAY_WORKER_URL`, `WORKER_SECRET` | ⭕ | URL + secret của video worker. Thiếu thì upload video vẫn chạy nhưng bỏ qua faststart/transcript |
| `GROQ_API_KEY` | ⭕ | Groq Whisper — tạo transcript video (worker dùng) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | ⭕ | Gửi email (quên mật khẩu…) |
| `CORS_ALLOWED_ORIGINS` | ⭕ | Danh sách origin được phép gọi API |

✅ = bắt buộc để chạy app · ✅* = bắt buộc cho tính năng tương ứng · ⭕ = tùy chọn

---

## 5. Tài khoản thử nghiệm

Sau khi chạy `npx prisma db seed`:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@learnust.vn` | `Admin@123` |
| Giảng viên | `an.nguyen@learnust.vn` | `Teacher@123` |
| Giảng viên | `binh.tran@learnust.vn` | `Teacher@123` |
| Học viên | `cuong@student.vn` | `Student@123` |
| Học viên | `dung@student.vn` | `Student@123` |
| Học viên | `duc@student.vn`, `hoa@student.vn`, `huy@student.vn` | `Student@123` |

Trang chính theo vai trò: Admin → `/admin` · Giảng viên → `/teacher` · Học viên → `/student`.

---

## 6. Scripts

| Lệnh | Chức năng |
|---|---|
| `npm run dev` | Chạy dev server tại `http://localhost:3030` |
| `npm run build` | Build production |
| `npm start` | Chạy production server (port 3030) |
| `npm run lint` | Kiểm tra ESLint |
| `npm run worker` | Chạy video worker local (`worker/video.ts`, port 3001) — faststart video + transcript Whisper |
| `npm test` | Unit test (Vitest) |
| `npm run test:watch` | Unit test chế độ watch |
| `npm run test:integration` | Integration test |
| `npm run test:coverage` | Unit test kèm báo cáo coverage |
| `npm run test:e2e` | E2E test (Playwright) |
| `npx prisma migrate dev` | Tạo/áp dụng migration |
| `npx prisma db seed` | Seed dữ liệu mẫu |
| `npx prisma studio` | GUI xem/sửa dữ liệu |

---

## 7. Cấu trúc thư mục chính

```
app/
├── (auth)/          # login, register, forgot-password, đổi mật khẩu
├── (marketing)/     # trang công khai: danh sách & chi tiết khóa học
├── admin/           # dashboard quản trị: users, categories, thống kê
├── teacher/         # dashboard giảng viên: CRUD khóa học, analytics, chấm bài
├── student/         # trang học: video / PDF / quiz / bài tập code
└── api/             # REST API (Route Handlers) phân theo vai trò
lib/                 # auth (JWT, bcrypt), storage (S3/R2), axios client
prisma/
├── schema/          # schema tách file: user, course, quiz, post, roadmap…
├── migrations/      # lịch sử migration
└── seed*.ts         # các script seed
worker/              # video worker (deploy Railway) + Cloudflare worker
proxy.ts             # bảo vệ route theo vai trò (Next.js 16 thay middleware.ts)
docker-compose.yml   # Postgres 16 (port 5433) + MinIO (port 9002)
```
