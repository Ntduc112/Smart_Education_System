# Teacher Dashboard Design Spec
Date: 2026-05-03

## Overview
Build a fully functional teacher dashboard with sidebar navigation, overview stats, recent courses, and recent enrollments. When a teacher logs in, they land on `/teacher/dashboard`.

## Layout
- **Sidebar** (240px, fixed left): Logo, nav links (Dashboard, Khóa học, Phân tích, Bài luận), UserMenu at bottom
- **Main content area**: scrollable, `bg-[#f8fafc]`, max-w-6xl

## Components to Build

### 1. TeacherSidebar (app/teacher/_components/TeacherSidebar.tsx)
- Logo + brand name at top
- Nav items with active state highlight: Dashboard `/teacher/dashboard`, Khóa học `/teacher/courses`, Phân tích `/teacher/analytics`, Bài luận `/teacher/courses/[id]/essays` (or link to courses)
- UserMenu at bottom (reuse existing component)

### 2. Teacher Layout (app/teacher/layout.tsx)
- Wrap children with sidebar + main area
- Add role guard: redirect to `/login` if not authenticated as TEACHER

### 3. API endpoint (app/api/teacher/dashboard/route.ts)
Returns a single aggregated payload:
```json
{
  "stats": {
    "total_courses": 12,
    "published": 8,
    "draft": 4,
    "total_students": 230,
    "revenue_this_month": 4500000
  },
  "recent_courses": [
    { "id", "title", "thumbnail", "status", "enrollment_count", "updated_at" }
  ],
  "recent_enrollments": [
    { "enrolled_at", "user": { "name", "avatar" }, "course": { "id", "title" } }
  ]
}
```

### 4. Dashboard hook (app/teacher/dashboard/dashboard.hook.ts)
- `useTeacherDashboard()` — single React Query fetch to `/api/teacher/dashboard`
- `useMe()` — reuse pattern from student dashboard

### 5. Dashboard Page (app/teacher/dashboard/page.tsx)
Sections:
1. **Header** — greeting (Chào buổi sáng/chiều/tối + tên), button "+ Tạo khóa học mới" → `/teacher/courses/new`
2. **Stats row** — 5 StatCards: Tổng khóa học, Đã công bố, Đang nháp, Tổng học viên, Doanh thu tháng này
3. **2-column section**:
   - Left: "Khóa học gần đây" — list 5 newest courses (thumbnail mini + title + PUBLISHED/DRAFT badge + enrollment count + Edit button)
   - Right: "Đăng ký mới" — list 8 newest enrollments (avatar + student name + course name + relative time)

## Design Tokens (from existing codebase)
- Primary blue: `#1b61c9`
- Dark text: `#181d26`
- Muted text: `rgba(4,14,32,0.55)`
- Background: `#f8fafc`
- Border: `#e0e2e6`
- Card: `bg-white rounded-2xl border border-[#e0e2e6]` + shadow `rgba(15,48,106,0.05) 0px 0px 20px`

## Data Model Notes
- `Course.status`: DRAFT | PUBLISHED
- `Enrollment`: user_id + course_id + enrolled_at
- `Payment`: status PAID + amount → revenue
- Revenue this month: SUM of payments where status=PAID and created_at in current month, joining through course where instructor_id=user

## Build Order
1. API endpoint `/api/teacher/dashboard`
2. Teacher layout + sidebar component
3. Dashboard hook + page
