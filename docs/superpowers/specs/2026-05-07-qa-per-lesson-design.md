# Q&A Per Lesson Design — Smart Education System

**Date:** 2026-05-07
**Sub-project:** 2 of 6 (Notification → **Q&A** → Wishlist → Search → Notes → Coupon)

---

## 1. Mục tiêu

Học viên có thể đặt câu hỏi ngay bên dưới từng bài học. Cả teacher và student khác đều có thể trả lời. Câu hỏi được sort theo votes nếu ≥ 10 upvotes, ngược lại sort theo thời gian.

---

## 2. Data Model

**4 model mới** — thêm vào `prisma/schema/qa.prisma`:

```prisma
model LessonQuestion {
  id         String          @id @default(uuid())
  lesson_id  String
  lesson     Lesson          @relation(fields: [lesson_id], references: [id], onDelete: Cascade)
  user_id    String
  user       User            @relation(fields: [user_id], references: [id], onDelete: Cascade)
  content    String
  created_at DateTime        @default(now())
  replies    QuestionReply[]
  votes      QuestionVote[]
}

model QuestionReply {
  id          String         @id @default(uuid())
  question_id String
  question    LessonQuestion @relation(fields: [question_id], references: [id], onDelete: Cascade)
  user_id     String
  user        User           @relation(fields: [user_id], references: [id], onDelete: Cascade)
  content     String
  created_at  DateTime       @default(now())
  votes       ReplyVote[]
}

model QuestionVote {
  question_id String
  question    LessonQuestion @relation(fields: [question_id], references: [id], onDelete: Cascade)
  user_id     String
  user        User           @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([question_id, user_id])
}

model ReplyVote {
  reply_id String
  reply    QuestionReply @relation(fields: [reply_id], references: [id], onDelete: Cascade)
  user_id  String
  user     User          @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([reply_id, user_id])
}
```

**Thêm relations vào các model hiện có:**

`prisma/schema/course.prisma` — Lesson model:
```prisma
questions LessonQuestion[]
```

`prisma/schema/user.prisma` — User model:
```prisma
questions      LessonQuestion[]
questionReplies QuestionReply[]
questionVotes  QuestionVote[]
replyVotes     ReplyVote[]
```

---

## 3. API Routes

| Route | Method | Auth | Mô tả |
|---|---|---|---|
| `/api/lessons/[id]/questions` | GET | Enrolled student hoặc Teacher của course | Lấy questions + sort |
| `/api/lessons/[id]/questions` | POST | Enrolled student | Tạo câu hỏi mới |
| `/api/questions/[id]/replies` | POST | Enrolled student hoặc Teacher của course | Tạo reply |
| `/api/questions/[id]/vote` | POST | Enrolled student | Toggle vote (tạo nếu chưa có, xóa nếu đã có) |
| `/api/replies/[id]/vote` | POST | Enrolled student | Toggle vote reply |

### Sorting logic (server-side)

```ts
const high  = questions.filter(q => q._count.votes >= 10)
                        .sort((a, b) => b._count.votes - a._count.votes);
const low   = questions.filter(q => q._count.votes < 10)
                        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
const sorted = [...high, ...low];
```

### Response shape GET `/api/lessons/[id]/questions`

```ts
{
  questions: {
    id: string;
    content: string;
    created_at: string;
    vote_count: number;        // _count.votes
    reply_count: number;       // _count.replies
    has_voted: boolean;        // whether current user already voted
    user: { id: string; name: string; avatar: string | null; role: string };
    replies: {
      id: string;
      content: string;
      created_at: string;
      vote_count: number;
      has_voted: boolean;
      user: { id: string; name: string; avatar: string | null; role: string };
    }[];
  }[]
}
```

### Notification triggers

- Khi **teacher** reply câu hỏi của student → `createNotification(question.user_id, "QA_REPLY", "Giáo viên đã trả lời", "...", link)`
- Khi **student** reply câu hỏi của người khác → `createNotification(question.user_id, "QA_REPLY", "Có người trả lời câu hỏi của bạn", "...", link)`
- Không notify nếu reply chính câu hỏi của mình

---

## 4. Frontend

### Vị trí

Q&A Section đặt **bên dưới content bài học** trong `app/student/courses/[courseId]/learn/page.tsx`.

### Components

**`app/student/courses/[courseId]/learn/_components/QASection.tsx`**

Layout:
```
[ Header: "Hỏi & Đáp (N câu hỏi)" ]
[ Textarea đặt câu hỏi + nút Gửi  ]
[ Danh sách QuestionCard           ]
```

**`QuestionCard`** (trong QASection.tsx):
- Hiển thị: avatar, tên user, role badge (TEACHER = xanh, STUDENT = xám), content, vote count, reply count
- VoteButton: toggle, optimistic update, disabled nếu là câu hỏi của chính mình
- Nút "Xem N trả lời" → expand ReplyList + form reply
- Khi collapsed: chỉ hiện số reply

**`VoteButton`** (trong QASection.tsx):
- `ThumbsUp` icon + số vote
- Active state khi `has_voted = true`
- Optimistic update (toggle ngay trên UI, revert nếu API lỗi)

### Hooks (thêm vào `learn.hook.ts`)

```ts
useQuestions(lessonId: string)
// → useQuery GET /api/lessons/[lessonId]/questions

useAskQuestion(lessonId: string)
// → useMutation POST /api/lessons/[lessonId]/questions
// → invalidate ["questions", lessonId]

usePostReply(questionId: string)
// → useMutation POST /api/questions/[questionId]/replies
// → invalidate ["questions", lessonId]

useToggleQuestionVote(lessonId: string)
// → useMutation POST /api/questions/[id]/vote
// → optimistic update has_voted + vote_count

useToggleReplyVote(lessonId: string)
// → useMutation POST /api/replies/[id]/vote
// → optimistic update has_voted + vote_count
```

---

## 5. Files cần tạo/sửa

| File | Action |
|---|---|
| `prisma/schema/qa.prisma` | Tạo mới |
| `prisma/schema/course.prisma` | Thêm `questions LessonQuestion[]` vào Lesson |
| `prisma/schema/user.prisma` | Thêm 4 relations Q&A |
| `app/api/lessons/[id]/questions/route.ts` | Tạo mới (GET + POST) |
| `app/api/questions/[id]/replies/route.ts` | Tạo mới (POST) |
| `app/api/questions/[id]/vote/route.ts` | Tạo mới (POST toggle) |
| `app/api/replies/[id]/vote/route.ts` | Tạo mới (POST toggle) |
| `app/student/courses/[courseId]/learn/_components/QASection.tsx` | Tạo mới |
| `app/student/courses/[courseId]/learn/learn.hook.ts` | Thêm Q&A hooks |
| `app/student/courses/[courseId]/learn/page.tsx` | Thêm `<QASection lessonId={...} />` |

---

## 6. Out of scope

- Edit/Delete câu hỏi hoặc reply
- Teacher đánh dấu "Best Answer"
- Search trong Q&A
- Pagination (load first 20 questions, đủ cho MVP)
