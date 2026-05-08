# Course Search Nâng Cao — Smart Education System

**Date:** 2026-05-08
**Sub-project:** 4 of 6 (Notification → Q&A → Wishlist → **Search** → Notes → Coupon)

---

## 1. Mục tiêu

Mở rộng tìm kiếm khóa học hiện tại trên trang `/courses`:
- Tìm theo title + description + instructor name (thay vì chỉ title)
- Thêm filter giá: Tất cả / Miễn phí / Có phí (với khoảng giá min–max)
- Thêm sort: Mới nhất / Nhiều học viên / Giá tăng dần / Giá giảm dần
- Đồng bộ toàn bộ filter vào URL params (shareable)

Không tạo trang mới — mở rộng `/courses` hiện có.

---

## 2. API Changes

**File:** `app/api/courses/route.ts`

### Params mới

| Param | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `sort` | `newest` \| `popular` \| `price_asc` \| `price_desc` | `newest` | Thứ tự sắp xếp |
| `priceType` | `free` \| `paid` \| `all` | `all` | Loại giá |
| `minPrice` | number | — | Giá tối thiểu (chỉ khi `priceType=paid`) |
| `maxPrice` | number | — | Giá tối đa (chỉ khi `priceType=paid`) |

### Search mở rộng

Thay `{ title: { contains: search, mode: "insensitive" } }` bằng:

```ts
{
  OR: [
    { title:       { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } },
    { instructor:  { name: { contains: search, mode: "insensitive" } } },
  ]
}
```

### Price filter logic

```ts
const priceWhere =
  priceType === "free" ? { price: { equals: 0 } }
  : priceType === "paid"
    ? {
        price: {
          gt: 0,
          ...(minPrice != null ? { gte: minPrice } : {}),
          ...(maxPrice != null ? { lte: maxPrice } : {}),
        },
      }
    : {};
```

### Sort mapping

```ts
const orderBy =
  sort === "popular"    ? { enrollments: { _count: "desc" } }
  : sort === "price_asc"  ? { price: "asc" }
  : sort === "price_desc" ? { price: "desc" }
  : { created_at: "desc" };   // "newest" — default
```

`count` query phải áp dụng cùng `priceWhere` và search filter (không cần sort).

---

## 3. Frontend

### Hook — `courses.hook.ts`

Thêm vào `CoursesFilter`:
```ts
sort?:      "newest" | "popular" | "price_asc" | "price_desc";
priceType?: "free" | "paid" | "all";
minPrice?:  number;
maxPrice?:  number;
```

`fetchCourses` append thêm 4 params mới vào URLSearchParams.

### UI — filter row trong `CoursesPage`

Layout filter row sau khi update:
```
[ Level ▾ ] [ Sort ▾ ] [ Tất cả | Miễn phí | Có phí ]    X khóa học
```

Khi chọn "Có phí", hiện thêm một row bên dưới:
```
Từ [________] đến [________] VND  [Áp dụng]
```

**Sort dropdown** — select element, options:
- `newest` → "Mới nhất"
- `popular` → "Nhiều học viên nhất"
- `price_asc` → "Giá tăng dần"
- `price_desc` → "Giá giảm dần"

**Price toggle** — 3 nút pill dạng button group (giống category tabs):
- Active: `bg-[#1b61c9] text-white`
- Inactive: `bg-white border border-[#e0e2e6]`

**Price range inputs** — 2 input `type="number"`, placeholder `0` và `10.000.000`. Nhấn Enter hoặc blur → cập nhật filter. Nút "Áp dụng" cũng trigger.

### URL State

Toàn bộ filter đồng bộ vào URL search params bằng `router.replace` (không push để không spam history). Params: `search`, `category`, `level`, `sort`, `priceType`, `minPrice`, `maxPrice`, `page`.

Khi page load, đọc initial state từ `useSearchParams()` thay vì `useState("")`.

---

## 4. Files cần sửa

| File | Thay đổi |
|---|---|
| `app/api/courses/route.ts` | Thêm sort, priceType, minPrice/maxPrice; mở rộng OR search |
| `app/(marketing)/courses/courses.hook.ts` | Thêm 4 field vào `CoursesFilter`, append params |
| `app/(marketing)/courses/page.tsx` | Thêm sort dropdown, price toggle, price range inputs; sync URL state |

---

## 5. Out of scope

- Full-text search / PostgreSQL `tsvector` (LIKE là đủ cho MVP)
- Rating filter
- Duration filter
- Lưu filter preferences vào localStorage
- Search suggestions / autocomplete
