# Wishlist Design — Smart Education System

**Date:** 2026-05-07
**Sub-project:** 3 of 6 (Notification → Q&A → **Wishlist** → Search → Notes → Coupon)

---

## 1. Mục tiêu

Student có thể lưu khóa học yêu thích bằng nút ngôi sao toggle. Xem lại danh sách đã lưu tại trang riêng `/student/wishlist`.

---

## 2. Data Model

Thêm file `prisma/schema/wishlist.prisma`:

```prisma
model Wishlist {
  user_id   String
  user      User   @relation(fields: [user_id], references: [id], onDelete: Cascade)
  course_id String
  course    Course @relation(fields: [course_id], references: [id], onDelete: Cascade)

  @@id([user_id, course_id])
}
```

**Thêm relations vào các model hiện có:**

`prisma/schema/user.prisma` — User model:
```prisma
wishlist Wishlist[]
```

`prisma/schema/course.prisma` — Course model:
```prisma
wishlist Wishlist[]
```

---

## 3. API Routes

| Route | Method | Auth | Mô tả |
|---|---|---|---|
| `/api/student/wishlist` | GET | Student | Lấy danh sách course đã lưu |
| `/api/student/wishlist` | POST | Student | Toggle wishlist — body `{ course_id }` |

### Response GET

```ts
{
  wishlist: {
    course_id: string;
    course: {
      id: string;
      title: string;
      thumbnail: string;
      price: string;
      level: string;
      status: string;
      instructor: { name: string };
      category: { name: string };
      _count: { enrollments: number };
    };
  }[]
}
```

### Response POST

```ts
{ wishlisted: boolean }
```

`wishlisted: true` = vừa thêm, `false` = vừa xóa. Client dùng để sync UI.

---

## 4. Frontend

### WishlistButton component

`app/_components/WishlistButton.tsx` — dùng chung ở cả hai nơi:

- Icon ngôi sao: filled `★` khi `wishlisted`, outline `☆` khi chưa
- Click toggle → optimistic update ngay, revert nếu API lỗi
- Nếu chưa đăng nhập (`user === null`) → redirect `/login`
- Disabled khi mutation đang pending

Props:
```ts
{ courseId: string; initialWishlisted: boolean }
```

**Vị trí đặt:**
- `/courses` — góc trên phải thumbnail mỗi `CourseCard`, overlay với `absolute top-2 right-2`
- `/courses/[id]` — bên cạnh nút "Mua khóa học" / "Học ngay" trong action bar

### Trang `/student/wishlist`

`app/student/wishlist/page.tsx`

Layout:
```
[ Header: "Khóa học đã lưu (N)" ]
[ Grid 3 cột — course cards    ]
[ Empty state nếu rỗng         ]
```

Course card hiển thị: thumbnail, title, instructor, category, price, level badge.
Mỗi card có `WishlistButton` (star filled) — click bỏ → card biến mất khỏi danh sách (optimistic remove).

Empty state: icon ngôi sao + "Bạn chưa lưu khóa học nào. Khám phá các khóa học ngay!"

### Hooks

File `app/student/wishlist/wishlist.hook.ts`:

```ts
useWishlist()
// → useQuery GET /api/student/wishlist
// → queryKey: ["wishlist"]

useToggleWishlist()
// → useMutation POST /api/student/wishlist { course_id }
// → optimistic: toggle wishlisted + remove từ list nếu wishlisted = false
// → onError: revert
```

### Navigation

Thêm link "Khóa học đã lưu" vào student dashboard page (bên cạnh các quick link hiện có).

---

## 5. Files cần tạo/sửa

| File | Action |
|---|---|
| `prisma/schema/wishlist.prisma` | Tạo mới |
| `prisma/schema/user.prisma` | Thêm `wishlist Wishlist[]` |
| `prisma/schema/course.prisma` | Thêm `wishlist Wishlist[]` |
| `app/api/student/wishlist/route.ts` | Tạo mới (GET + POST toggle) |
| `app/_components/WishlistButton.tsx` | Tạo mới |
| `app/student/wishlist/wishlist.hook.ts` | Tạo mới |
| `app/student/wishlist/page.tsx` | Tạo mới |
| `app/(marketing)/courses/page.tsx` | Thêm WishlistButton vào CourseCard |
| `app/(marketing)/courses/[id]/page.tsx` | Thêm WishlistButton vào action bar |

---

## 6. Out of scope

- Notification khi course trong wishlist giảm giá
- Sắp xếp / filter danh sách wishlist
- Số lượng wishlist hiển thị trên header badge
