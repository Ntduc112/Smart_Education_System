# Note-Taking Design — Learnust

**Date:** 2026-05-08
**Sub-project:** 5 of 6 (Notification → Q&A → Wishlist → Search → **Notes** → Coupon)

---

## 1. Mục tiêu

Student có thể ghi nhiều note plain text cho từng bài học. Xem lại inline khi học, và tổng hợp toàn bộ notes tại trang riêng `/student/notes`.

---

## 2. Data Model

Thêm file `prisma/schema/note.prisma`:

```prisma
model LessonNote {
  id         String   @id @default(uuid())
  user_id    String
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  lesson_id  String
  lesson     Lesson   @relation(fields: [lesson_id], references: [id], onDelete: Cascade)
  content    String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

**Relations thêm vào:**

`prisma/schema/user.prisma` — User model:
```prisma
notes LessonNote[]
```

`prisma/schema/course.prisma` — Lesson model:
```prisma
notes LessonNote[]
```

---

## 3. API Routes

| Route | Method | Auth | Mô tả |
|---|---|---|---|
| `/api/lessons/[id]/notes` | GET | Enrolled student | Lấy notes của lesson (chỉ của user hiện tại) |
| `/api/lessons/[id]/notes` | POST | Enrolled student | Tạo note mới — body `{ content }` |
| `/api/notes/[id]` | PATCH | Owner (user_id match) | Cập nhật content — body `{ content }` |
| `/api/notes/[id]` | DELETE | Owner (user_id match) | Xóa note |
| `/api/student/notes` | GET | Student | Lấy tất cả notes, group data cho trang tổng hợp |

### Auth pattern
- GET/POST `/api/lessons/[id]/notes`: check enrollment (giống Q&A)
- PATCH/DELETE `/api/notes/[id]`: check `note.user_id === userId` (owner only)

### Response GET `/api/lessons/[id]/notes`

```ts
{
  notes: {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
  }[]
}
```

### Response GET `/api/student/notes`

```ts
{
  notes: {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    lesson: {
      id: string;
      title: string;
      chapter: {
        course: { id: string; title: string; thumbnail: string }
      }
    }
  }[]
}
```

Client group notes theo `lesson.chapter.course.id` để hiển thị accordion.

---

## 4. Frontend

### NotesSection component

`app/student/courses/[courseId]/learn/_components/NotesSection.tsx`

Đặt bên dưới `QASection` trong learn page (chỉ render khi `selectedItem.kind === "lesson"`).

Layout:
```
[ Header: "Ghi chú của tôi (N)" ]
[ Textarea + nút "Thêm ghi chú" ]
[ Danh sách NoteCard            ]
```

**NoteCard**:
- Hiển thị: content, thời gian tạo/cập nhật (`timeAgo`)
- Nút Edit → chuyển sang inline textarea, nút Lưu + Hủy
- Nút Delete → confirm inline ("Xóa ghi chú này?" + nút Xác nhận), không dùng modal

### Trang `/student/notes`

`app/student/notes/page.tsx`

- Fetch `useAllNotes()`, group theo `course.id`
- Mỗi course: accordion (expand mặc định) với thumbnail + title header
- Bên trong: list notes, mỗi note có lesson title, content, thời gian, nút Edit + Delete
- Edit note inline (textarea replace content)
- Link "Học tiếp" → `/student/courses/[courseId]/learn?lesson=[lessonId]`
- Empty state: icon + "Chưa có ghi chú nào. Bắt đầu ghi chú khi học bài!"

### Hooks

File `app/student/courses/[courseId]/learn/_components/notes.hook.ts`:

```ts
useNotes(lessonId: string)
// → useQuery GET /api/lessons/[id]/notes
// → queryKey: ["notes", lessonId]

useAddNote(lessonId: string)
// → useMutation POST /api/lessons/[id]/notes { content }
// → onSuccess: invalidate ["notes", lessonId]

useUpdateNote(lessonId: string)
// → useMutation PATCH /api/notes/[id] { content }
// → onSuccess: invalidate ["notes", lessonId]

useDeleteNote(lessonId: string)
// → useMutation DELETE /api/notes/[id]
// → onSuccess: invalidate ["notes", lessonId]

useAllNotes()
// → useQuery GET /api/student/notes
// → queryKey: ["all-notes"]
// → dùng riêng cho /student/notes page
```

### Navigation

Thêm link "Ghi chú" trong student dashboard page (cạnh link "Khóa học đã lưu" đã thêm trước đó).

---

## 5. Files cần tạo/sửa

| File | Action |
|---|---|
| `prisma/schema/note.prisma` | Tạo mới |
| `prisma/schema/user.prisma` | Thêm `notes LessonNote[]` |
| `prisma/schema/course.prisma` | Thêm `notes LessonNote[]` vào Lesson |
| `app/api/lessons/[id]/notes/route.ts` | Tạo mới (GET + POST) |
| `app/api/notes/[id]/route.ts` | Tạo mới (PATCH + DELETE) |
| `app/api/student/notes/route.ts` | Tạo mới (GET) |
| `app/student/courses/[courseId]/learn/_components/notes.hook.ts` | Tạo mới |
| `app/student/courses/[courseId]/learn/_components/NotesSection.tsx` | Tạo mới |
| `app/student/courses/[courseId]/learn/page.tsx` | Thêm `<NotesSection>` dưới QASection |
| `app/student/notes/page.tsx` | Tạo mới |

---

## 6. Out of scope

- Export notes (PDF, text file)
- Search trong notes
- Chia sẻ notes với học viên khác
- Timestamp video (ghi chú tại giây X của video)
- Màu sắc / tag cho note
