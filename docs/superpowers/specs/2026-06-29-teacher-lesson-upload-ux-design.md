# Teacher Lesson Upload UX — Design

Date: 2026-06-29
Status: Approved (direction A — targeted fixes)
Area: `app/teacher/courses/[id]/edit`

## Problem

Teachers struggle to upload lessons. Observed pains:

1. **No orientation** — first visit to the editor is a blank slate; unclear whether to add a chapter or lesson first, or what to click.
2. **Rambling manual flow** — add lesson → name → choose video/youtube → add PDF → click Save. Steps feel disconnected; easy to forget Save; no signal a lesson is "done".
3. **Video/PDF upload unclear** — which is required, can you drag-drop, how far along an upload is.
4. **`is_free` not discoverable** — the Miễn phí/Trả phí control looks like a static badge; nobody realizes it's a clickable toggle.
5. **Hidden transcription dependency (root cause of "save twice")** — see below.

### Root cause of "must save twice"

Pipeline today:

- Video upload finishes (browser PUT to R2) → frontend fires `POST /teacher/upload-video/confirm` → worker runs faststart + **transcribe (Groq Whisper) in the background**, writing `VideoTranscript { video_key, status, text }`.
- But `lesson.video_url` is only persisted to the DB when the teacher clicks **Lưu bài học**.
- AI quiz (`POST /teacher/ai/generate-quiz`) reads the transcript by `videoKey` parsed from `lesson.video_url` **in the DB**, and only if `VideoTranscript.status === "done"`.

So to use AI-quiz-from-video the teacher must: upload → Save (persist `video_url`) → wait for transcription to finish (invisible, no feedback) → open AI quiz. Because transcription is still running at the first Save, it feels like "save again to make it work." Everything is invisible — no status, no gating.

## Direction

Targeted fixes that keep the current architecture and the worker/transcription pipeline untouched. Make the hidden state visible and the controls discoverable.

## Changes

### 1. Auto-persist `video_url` after upload

On video upload `onComplete`, automatically save the lesson (current form values) so `video_url` lands in the DB immediately. Removes the "first Save". Manual Save button stays for other edits.

- Trade-off: this auto-save also persists any half-edited form fields. Acceptable — the teacher just took the deliberate action of uploading a video.
- Applies to a lesson that already exists server-side (lessons get a real DB id when created via "Thêm bài học"). No new-lesson edge case.

### 2. Transcription status chip

Below the Video section, a realtime chip reflecting `VideoTranscript.status`:

- `processing` → "Đang trích lời giảng video…" (spinner)
- `done` → "✓ Lời giảng sẵn sàng — tạo quiz AI được rồi"
- `failed` → "✗ Trích lời giảng thất bại" + a retry action
- no transcript row yet (just uploaded) → treat as processing

**New endpoint:** `GET /api/teacher/lessons/[id]/transcript-status`
- Auth: lesson's course instructor only.
- Reads `lesson.video_url`; if it is an `r2:videos/...` key, parse `videoKey` and look up `VideoTranscript` by `video_key`.
- Returns `{ status: "processing" | "done" | "failed" | "none" }` (`none` = no video / not an R2 video).

Frontend polls every ~4s while status is `processing`; stops on `done`/`failed`/`none`.

### 3. AI quiz button gating + warning

Inputs: `hasText` (content or PDF present), `hasVideo` (`video_url` present), `transcriptReady` (`status === "done"`).

- **`transcriptReady`, or no video** → button enabled, no warning. (Video transcript is included when present.)
- **video present + transcript not done + `hasText`** → button still clickable, but:
  - Hover tooltip: "Lời giảng video chưa trích xong — quiz sẽ thiếu phần video".
  - On click → **confirmation modal**: "Trích lời giảng video chưa xong. Tạo quiz bây giờ sẽ không gồm nội dung video. Bạn muốn?" → [Tạo luôn] / [Đợi lời giảng].
- **only video + transcript not done + no text/PDF** → button **disabled** + tooltip "Đợi trích lời giảng xong (chưa có nội dung khác)". (Generating now would fail with `no_content`.)

No backend change — `generate-quiz` already accepts content/PDF/transcript and returns `no_content` when empty.

### 4. Discoverable `is_free` switch

Replace the badge-like button with an explicit on/off switch:
- Label: "Cho học viên xem thử (miễn phí)"
- Helper text: "Bài này xem được dù chưa mua khóa".
- Keeps the same `is_free` boolean and save path.

### 5. Editor empty state

When the course has 0 chapters, the left content tree shows a guided empty state instead of a blank column: a prominent "Thêm chương đầu tiên" plus "Import từ folder".

### 6. Clearer video/PDF affordances

- "(tuỳ chọn)" labels on Video and PDF sections.
- Clear upload progress bar + a "Đang xử lý…" label after the PUT completes (before `onComplete`).
- Drag-and-drop for video: **nice-to-have, optional** — implement only if time permits; not required for this spec to be done.

## Scope (files)

- `app/teacher/courses/[id]/edit/page.tsx` — VideoUploadSection (status chip, progress label, "(tuỳ chọn)"), LessonPanel (AI quiz gating + warning modal), `is_free` switch, empty state.
- `app/teacher/courses/[id]/edit/edit.hook.ts` — auto-save lesson after video upload; new hook to poll transcript status.
- `app/api/teacher/lessons/[id]/transcript-status/route.ts` — **new** GET endpoint.

Out of scope: `worker/video.ts`, the transcription pipeline, bulk import, schema changes.

## Success criteria

1. After uploading a video, `lesson.video_url` is in the DB without a manual Save (verify: upload, reload page, `video_url` present).
2. The transcription status chip shows processing → done as the worker completes (verify against a real upload, or a seeded `VideoTranscript` row per status).
3. AI quiz button: enabled when transcript done or no video; warning modal when video+text but transcript pending; disabled when only-video+pending. (verify each of the three states.)
4. `is_free` renders as a labeled switch with helper text and toggles the same value (verify: toggle on, save, badge "Free" appears in ChapterTree).
5. Empty course shows the guided empty state with working "Thêm chương đầu tiên" / "Import từ folder" (verify on a course with no chapters).
