# Notification System Design — Smart Education System

**Date:** 2026-05-07
**Sub-project:** 1 of 6 (Notification → Q&A → Wishlist → Search → Notes → Coupon)

---

## 1. Mục tiêu

Xây dựng in-app notification system cho phép student và teacher nhận thông báo về các sự kiện quan trọng. Notification hiển thị qua bell icon trên header toàn site, cập nhật tự động mỗi 30 giây.

---

## 2. Approach

Polling-based (không real-time). Header fetch notifications mỗi 30s. Đủ responsive cho use case này, không cần thêm dependency.

---

## 3. Data Model

**Thêm vào `prisma/schema/`** (file mới: `notification.prisma`):

```prisma
model Notification {
  id         String   @id @default(uuid())
  user_id    String
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  type       String   // "ENROLLMENT" | "PAYMENT" | "QUIZ_RESULT" | "QA_REPLY"
  title      String
  message    String
  link       String?
  is_read    Boolean  @default(false)
  created_at DateTime @default(now())
}
```

**Thêm vào `prisma/schema/user.prisma`:**
```prisma
notifications Notification[]
```

---

## 4. API Routes

| Route | Method | Mô tả |
|---|---|---|
| `/api/notifications` | GET | Lấy 20 notification mới nhất của user hiện tại, unread trước |
| `/api/notifications/[id]/read` | PATCH | Mark 1 notification as read |
| `/api/notifications/read-all` | PATCH | Mark tất cả as read |

**Response shape GET `/api/notifications`:**
```ts
{
  notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
  }[];
  unread_count: number;
}
```

**Auth:** Tất cả routes yêu cầu login — đọc user từ JWT cookie (giống pattern hiện tại trong dự án).

---

## 5. Helper Function

**File mới: `lib/notification.ts`**

```ts
createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
): Promise<void>
```

Dùng `prisma.notification.create()`. Gọi fire-and-forget (không await) trong các API route để không block response.

---

## 6. Trigger Points

Thêm `createNotification()` vào các API route hiện có:

| File | Event | Recipient | Title | Message | Link |
|---|---|---|---|---|---|
| `app/api/payment/webhook/route.ts` | Payment PAID | Student | "Thanh toán thành công" | "Bạn đã đăng ký khóa học [tên]" | `/student/dashboard` |
| `app/api/payment/webhook/route.ts` | Payment PAID | Teacher (course owner) | "Học viên mới" | "[Tên student] đã đăng ký [tên khóa]" | `/teacher/courses/[id]/students` |
| `app/api/student/quizzes/[id]/attempts/route.ts` | Quiz submitted | Student | "Kết quả quiz" | "Bạn đạt [score]/100 — [Đạt/Không đạt]" | `/student/dashboard` |

*(Q&A_REPLY trigger sẽ được thêm khi build Q&A feature)*

---

## 7. Frontend

### `app/_components/notifications.hook.ts`

```ts
useNotifications() → {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}
```

- `useQuery` với `refetchInterval: 30_000` và `refetchOnWindowFocus: true`
- `markRead` và `markAllRead` dùng `useMutation` + optimistic update (đặt `is_read: true` ngay trên client, không cần chờ server)

### `app/_components/NotificationBell.tsx`

- Bell icon (`lucide-react`) với badge đỏ số chưa đọc (ẩn khi = 0, hiển thị "99+" khi > 99)
- Click → dropdown overlay (fixed position, z-50)
- Dropdown header: "Thông báo" + nút "Đánh dấu tất cả đã đọc"
- Mỗi notification row:
  - Icon theo type: 💳 PAYMENT, 🎓 ENROLLMENT, 📝 QUIZ_RESULT, 💬 QA_REPLY
  - Title (bold nếu chưa đọc) + message (truncate 1 dòng)
  - Thời gian tương đối ("2 phút trước", "1 giờ trước")
  - Nền `bg-[#f0f4fb]` nếu chưa đọc, trắng nếu đã đọc
  - Click → router.push(link) + markRead(id)
- Empty state: "Chưa có thông báo nào"
- Click outside → đóng dropdown

### Cập nhật `app/_components/HeaderAuth.tsx`

Thêm `<NotificationBell />` bên cạnh `<UserMenu />`, chỉ render khi user đã login.

---

## 8. Files cần tạo/sửa

| File | Action |
|---|---|
| `prisma/schema/notification.prisma` | Tạo mới |
| `prisma/schema/user.prisma` | Thêm `notifications Notification[]` |
| `lib/notification.ts` | Tạo mới — helper createNotification |
| `app/api/notifications/route.ts` | Tạo mới — GET |
| `app/api/notifications/[id]/read/route.ts` | Tạo mới — PATCH |
| `app/api/notifications/read-all/route.ts` | Tạo mới — PATCH |
| `app/api/payment/webhook/route.ts` | Modify — thêm trigger |
| `app/api/student/quizzes/[id]/attempts/route.ts` | Modify — thêm trigger |
| `app/_components/notifications.hook.ts` | Tạo mới |
| `app/_components/NotificationBell.tsx` | Tạo mới |
| `app/_components/HeaderAuth.tsx` | Modify — thêm NotificationBell |

---

## 9. Out of scope

- Real-time push (WebSocket/SSE)
- Email notifications
- Push notifications (browser)
- Notification settings (bật/tắt từng loại)
- Q&A_REPLY trigger (sẽ thêm khi build Q&A)
- Xóa notification
