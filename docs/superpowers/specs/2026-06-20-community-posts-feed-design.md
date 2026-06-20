# Community Posts Feed — Design Spec

**Ngày:** 2026-06-20
**Trạng thái:** Đã duyệt, đang triển khai

## Mục tiêu

Thêm tính năng **bài viết cộng đồng** (posts feed) vào nền tảng. Mọi user đã đăng
nhập có thể đăng bài (text + ảnh/video), bài phải được **admin duyệt** trước khi
hiển thị. Feed nằm trên trang chủ `/`, **sau section khóa học**, chỉ hiện cho user
đã đăng nhập. Khách chưa đăng nhập thấy trang marketing như cũ.

Lý do: dashboard student hiện đơn điệu; feed cộng đồng tạo nội dung động, tăng
tương tác (like, comment) cho mọi vai trò.

## Phạm vi (YAGNI)

**Có:**
- Tạo post (text bắt buộc + media tùy chọn: 1 ảnh hoặc 1 video, upload R2 folder `posts/`)
- Duyệt bài: PENDING → APPROVED/REJECTED (chỉ admin)
- Feed approved (mới nhất trước, phân trang)
- Like (toggle) + comment (phẳng, không reply lồng)
- Xóa post (tác giả hoặc admin)

**Không (giai đoạn này):**
- Sửa post đã đăng (edit) — bỏ qua, sẽ thêm sau nếu cần
- Reply lồng nhau trong comment
- Like comment
- Nhiều media / album trong 1 post
- Scope theo khóa học (feed là chung toàn trường)

## Data model (`prisma/schema/post.prisma`)

Theo convention hiện có: snake_case, uuid id, `onDelete: Cascade`.

```prisma
enum post_status { PENDING APPROVED REJECTED }
enum post_media_type { IMAGE VIDEO }

model Post {
  id         String           @id @default(uuid())
  author_id  String
  author     User             @relation(fields: [author_id], references: [id], onDelete: Cascade)
  title      String
  content    String
  media_url  String?
  media_type post_media_type?
  status     post_status      @default(PENDING)
  created_at DateTime         @default(now())
  updated_at DateTime         @updatedAt
  comments   PostComment[]
  likes      PostLike[]
  @@index([status, created_at])
}

model PostComment {
  id         String   @id @default(uuid())
  post_id    String
  post       Post     @relation(fields: [post_id], references: [id], onDelete: Cascade)
  user_id    String
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  content    String
  created_at DateTime @default(now())
}

model PostLike {
  post_id String
  post    Post   @relation(fields: [post_id], references: [id], onDelete: Cascade)
  user_id String
  user    User   @relation(fields: [user_id], references: [id], onDelete: Cascade)
  @@id([post_id, user_id])
}
```

Thêm back-relation vào `User` (`prisma/schema/user.prisma`):
`posts Post[]`, `postComments PostComment[]`, `postLikes PostLike[]`.

## Quyền (do middleware `proxy.ts` cưỡng chế)

- `/api/posts/**` không nằm trong PUBLIC_ROUTES → tự động yêu cầu login, middleware
  inject `x-user-id` + `x-user-role`. → Xem feed/like/comment đều cần login. ✅
- `/api/admin/posts/**` → middleware ép role ADMIN. ✅
- Tạo post: mọi user login (đọc `x-user-id`), status mặc định PENDING.
- Xóa post: tác giả (`author_id === x-user-id`) hoặc role ADMIN.

## API (mirror `app/api/questions`, `app/api/teacher/upload-video/presigned`)

| Route | Method | Mô tả |
|---|---|---|
| `app/api/posts/route.ts` | GET | List APPROVED, phân trang `?page&limit`, kèm author, `_count` like/comment, `likedByMe` |
| | POST | Tạo post → PENDING. Body: `{title, content, mediaUrl?, mediaType?}` (zod) |
| `app/api/posts/[id]/route.ts` | GET | 1 post (kèm comments, counts, likedByMe) |
| | DELETE | Tác giả hoặc admin |
| `app/api/posts/[id]/like/route.ts` | POST | Toggle like (upsert/delete PostLike) |
| `app/api/posts/[id]/comments/route.ts` | GET | List comment của post |
| | POST | Thêm comment. Body `{content}` |
| `app/api/posts/upload/presigned/route.ts` | GET | `?contentType` → presigned PUT, key `posts/<uuid>.<ext>`, cho image+video |
| `app/api/admin/posts/route.ts` | GET | List theo `?status` (mặc định PENDING) cho admin |
| `app/api/admin/posts/[id]/route.ts` | PATCH | `{status: APPROVED|REJECTED}` |

Validation: zod (mirror ReplySchema). `title` ≤ 200, `content` ≤ 5000, `comment` ≤ 2000.

## UI

Design tokens hiện có: primary `#1b61c9`, text `#181d26`, bg `#f8fafc`, `rounded-2xl`,
framer-motion, icon `lucide-react`, data qua `@/lib/axios` + `@tanstack/react-query`.

- `app/_components/posts.hook.ts` — react-query hooks: `usePostsFeed`, `useCreatePost`,
  `useToggleLike`, `usePostComments`, `useAddComment`, `useUploadMedia`. Dùng `useMe`
  sẵn có để biết login.
- `app/_components/PostsFeedSection.tsx` — client component, render trên `/` sau
  `CoursesSection`. Tự ẩn nếu `useMe` lỗi/401 (khách). Gồm: nút mở composer, danh sách
  post (card: author, media, title/content, like btn, comment toggle), composer modal
  (text + chọn ảnh/video → upload R2 → submit).
- `app/page.tsx` — chèn `<PostsFeedSection />` sau `<CoursesSection />`.
- `app/admin/posts/page.tsx` + `posts.hook.ts` — hàng đợi duyệt: tab status, nút
  Duyệt/Từ chối. Thêm link "Bài viết" vào `AdminSidebar` NAV.

## Luồng tạo post

1. User mở composer, nhập title + content, (tùy chọn) chọn file ảnh/video.
2. Nếu có file: GET `/api/posts/upload/presigned?contentType=...` → PUT thẳng lên R2 →
   `mediaUrl = S3_PUBLIC_URL/posts/<uuid>.<ext>`.
3. POST `/api/posts` `{title, content, mediaUrl, mediaType}` → tạo PENDING.
4. UI báo "Chờ duyệt". Post không lên feed tới khi admin APPROVED.

## Testing / verify

- `npx tsc --noEmit` sạch.
- Migration tạo bảng thành công (`prisma migrate dev`).
- Thủ công: tạo post → thấy PENDING; admin duyệt → lên feed; like/comment hoạt động;
  khách chưa login không thấy feed.
