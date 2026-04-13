# Course Management — Design Spec
Date: 2026-04-12

## Domain
Lập trình & Công nghệ (Programming & Technology)

## Roles & Permissions
- **Teacher**: Tạo và quản lý course của mình (DRAFT only), quản lý chapters và lessons
- **Admin**: Duyệt và publish/unpublish course, quản lý categories
- **Student**: Browse public courses, xem free lessons, xem full content sau khi enrolled
- **Public**: Browse courses, xem thông tin course + free lessons

## Auth Flow
- Teacher tạo course → status = DRAFT
- Admin review → đổi status = PUBLISHED
- Student chỉ thấy PUBLISHED courses ở public listing

## API Architecture
Approach: Mixed flat REST
- Public routes: `/api/courses/*`
- Teacher routes: `/api/teacher/*`
- Admin routes: `/api/admin/*`
- Student routes: `/api/student/*`

## Endpoints

### Public
| Method | Route | Mô tả |
|--------|-------|--------|
| GET | `/api/courses` | Listing + filter: category, level, price range, search |
| GET | `/api/courses/[id]` | Detail + chapters + lessons (free lessons có url, paid thì ẩn url) |

### Teacher
| Method | Route | Body |
|--------|-------|------|
| GET | `/api/teacher/courses` | — |
| POST | `/api/teacher/courses` | `{ title, description, thumbnail, price, level, category_id }` |
| GET | `/api/teacher/courses/[id]` | — |
| PUT | `/api/teacher/courses/[id]` | các field cần update |
| DELETE | `/api/teacher/courses/[id]` | — |
| POST | `/api/teacher/chapters` | `{ course_id, title, order }` |
| PUT | `/api/teacher/chapters/[id]` | `{ title, order }` |
| DELETE | `/api/teacher/chapters/[id]` | — |
| POST | `/api/teacher/lessons` | `{ chapter_id, title, order, video_url, pdf_url, is_free }` |
| PUT | `/api/teacher/lessons/[id]` | các field cần update |
| DELETE | `/api/teacher/lessons/[id]` | — |

### Admin
| Method | Route | Body |
|--------|-------|------|
| GET | `/api/admin/categories` | — |
| POST | `/api/admin/categories` | `{ name, description }` |
| PUT | `/api/admin/categories/[id]` | `{ name, description }` |
| DELETE | `/api/admin/categories/[id]` | — |
| GET | `/api/admin/courses` | Danh sách tất cả courses (kể cả DRAFT) |
| PUT | `/api/admin/courses/[id]/publish` | `{ status: "PUBLISHED" \| "DRAFT" }` |

### Student
| Method | Route | Mô tả |
|--------|-------|--------|
| GET | `/api/student/courses` | Danh sách course đã enrolled |
| GET | `/api/student/courses/[id]` | Full content course (đã enroll) |

## Folder Structure
```
app/api/
├── courses/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
├── teacher/
│   ├── courses/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   ├── chapters/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   └── lessons/
│       ├── route.ts
│       └── [id]/
│           └── route.ts
├── admin/
│   ├── categories/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   └── courses/
│       └── [id]/
│           └── publish/
│               └── route.ts
└── student/
    └── courses/
        ├── route.ts
        └── [id]/
            └── route.ts
```

## Business Rules
1. Teacher chỉ thấy và chỉnh sửa course của chính mình (`instructor_id = userId`)
2. Public listing chỉ trả về PUBLISHED courses
3. Public course detail: trả về `video_url`/`pdf_url` cho lesson có `is_free = true`, ẩn với lesson `is_free = false`
4. Student `/api/student/courses/[id]`: verify đã enrolled trước khi trả full content
5. Admin có thể thấy tất cả courses kể cả DRAFT
6. Khi xóa course: chỉ cho phép xóa nếu status = DRAFT

## Middleware
- `/api/teacher/*` → yêu cầu role = TEACHER
- `/api/admin/*` → yêu cầu role = ADMIN
- `/api/student/*` → yêu cầu đã login (bất kỳ role)
- `/api/courses/*` → public, không cần auth
