# Admin Pages Design — Smart Education System

**Date:** 2026-05-07  
**Scope:** 3 trang admin còn placeholder: dashboard, users, categories

---

## 1. Tổng quan

Hoàn thiện 3 trang admin hiện là placeholder. Tất cả API đã có sẵn, chỉ cần build UI + hook.

| Trang | File | Trạng thái |
|---|---|---|
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | Placeholder — cần replace |
| `/admin/users` | `app/admin/users/page.tsx` | Placeholder — cần replace |
| `/admin/categories` | `app/admin/categories/page.tsx` | Placeholder — cần replace |

---

## 2. Conventions (theo chuẩn dự án)

- Mỗi trang có file `*.hook.ts` riêng — fetch data bằng React Query
- Pure Tailwind CSS v4, không dùng component library
- Màu primary: `#1b61c9`, text: `#181d26`
- Icons: `lucide-react`
- Axios instance từ `@/lib/axios`

---

## 3. Admin Dashboard (`/admin/dashboard`)

### Mục đích
Trang tổng quan cho admin — xem nhanh health của hệ thống và điều hướng đến các khu vực.

### Layout
```
[5 KPI Cards]
[4 Quick-link Cards]
[Bảng Recent Enrollments (5 dòng)]
```

### KPI Cards
Lấy từ API `GET /api/admin/statistics` (field `overview`):
1. **Tổng users** — `total_users` (kèm `+new_users_month` tháng này)
2. **Học viên** — `total_students`
3. **Giáo viên** — `total_teachers`
4. **Tổng khóa học** — `total_courses`
5. **Doanh thu** — `total_revenue` (định dạng VNĐ)

### Quick-link Cards
4 card điều hướng đến:
- Quản lý Users → `/admin/students` + `/admin/teachers`
- Quản lý Categories → `/admin/categories`
- Thống kê chi tiết → `/admin/statistics`
- Khóa học → link đến `/admin/courses` (future)

### Recent Enrollments
Lấy từ API `GET /api/admin/users` với limit=5, sort mới nhất — hiển thị: tên user, email, role badge.

### Hook: `dashboard.hook.ts`
```ts
useAdminDashboard() → useQuery GET /api/admin/statistics
```

---

## 4. Admin Users (`/admin/users`)

### Mục đích
Xem toàn bộ user hệ thống, tìm kiếm và điều hướng đến detail.

### Layout
```
[Search input] [Filter role: ALL | STUDENT | TEACHER]
[Table: Avatar | Tên | Email | Role badge | Ngày tạo | Nút xem]
[Pagination]
```

### Table columns
- Avatar (ảnh hoặc initials fallback)
- Tên + email
- Role badge (STUDENT = xanh, TEACHER = tím, ADMIN = đỏ)
- Ngày tạo (format dd/MM/yyyy)
- Nút "Xem chi tiết" → `/admin/users/[id]`

### Filter & Search
- Search debounce 300ms theo tên hoặc email
- Filter role dùng 3 button toggle (ALL / STUDENT / TEACHER)
- Pagination 10 item/trang

### Hook: `users.hook.ts`
```ts
useAdminUsers({ search, role, page }) → useQuery GET /api/admin/users?search=&role=&page=&limit=10
```

### API đã có
`GET /api/admin/users` — hỗ trợ query params: `search`, `role`, `page`, `limit`

---

## 5. Admin Categories (`/admin/categories`)

### Mục đích
Quản lý danh mục khóa học — thêm, sửa, xóa.

### Layout
```
[Header: "Danh mục" + nút "Thêm danh mục"]
[Grid 3 cột: Category cards]
[Modal: Add/Edit form]
[Confirm dialog: Delete]
```

### Category Card
- Tên danh mục
- Số khóa học thuộc danh mục
- Nút Edit (mở modal sửa tên)
- Nút Delete (mở confirm dialog)

### Modal Form (Add/Edit)
- 1 field: Tên danh mục (required, max 100 ký tự)
- Nút Lưu / Hủy

### Delete Confirm
- Inline confirm ("Xóa danh mục này?") — không xóa nếu còn khóa học

### Hook: `categories.hook.ts`
```ts
useCategories()          → useQuery  GET    /api/admin/categories
useCreateCategory()      → useMutation POST  /api/admin/categories
useUpdateCategory(id)    → useMutation PUT   /api/admin/categories/[id]
useDeleteCategory(id)    → useMutation DELETE /api/admin/categories/[id]
```

### API đã có
- `GET/POST /api/admin/categories`
- `GET/PUT/DELETE /api/admin/categories/[id]`

---

## 6. Files cần tạo/sửa

| File | Action |
|---|---|
| `app/admin/dashboard/page.tsx` | Rewrite (replace placeholder) |
| `app/admin/dashboard/dashboard.hook.ts` | Tạo mới |
| `app/admin/users/page.tsx` | Rewrite (replace placeholder) |
| `app/admin/users/users.hook.ts` | Tạo mới |
| `app/admin/categories/page.tsx` | Rewrite (replace placeholder) |
| `app/admin/categories/categories.hook.ts` | Tạo mới |

Không cần tạo API mới — tất cả đã có sẵn.

---

## 7. Out of scope

- Không sửa các trang admin đã implement (statistics, students, teachers, user detail)
- Không thêm role-based access control mới
- Không thêm bulk actions (xóa nhiều user, v.v.)
