# Learnust — "Cozy-Blue" UI System

Hệ thiết kế cho giao diện hướng sinh viên (student/home, marketing landing, /posts).
Kéo file này vào session khác để giữ phong cách nhất quán.

## Vibe
Friendly-modern cho sinh viên. Nền xanh ấm, card bo lớn mềm, blob trôi nhẹ, gamification nhẹ.
KHÔNG dùng kiểu Airtable doanh nghiệp lạnh. KHÔNG gradient-text tím/xanh kiểu "AI slop".

## Fonts
- Body: Inter (`--font-inter`)
- Display (heading + số to): **Be Vietnam Pro** (`--font-bvp`), weight 400–700, subset `vietnamese` → Tailwind token `font-display`
- Pattern heading: `font-display` + font-light cho phần thường, `font-semibold text-[#1b61c9]` cho từ nhấn. KHÔNG bôi gradient lên chữ.

## Palette
- canvas: `#EFF5FE` ; gradient nền: `linear-gradient(170deg,#EFF5FE,#F3F8FE,#EAF2FD)`
- card: `#FFFFFF`
- ink: `#181d26` ; inkSoft: `rgba(4,14,32,0.62)` ; inkFaint: `rgba(4,14,32,0.40)`
- border: `#DCE6F4`
- primary blue: `#1b61c9` ; hover/dark: `#254fad` ; sky: `#2E8BE6`
- fills nhạt: `#EAF1FC` / `#E7EFFB` ; track/skeleton: `#E2ECF9`
- success/done: `#0E9F6E` ; achievement: `#7C5CFC`
- KHÔNG dùng cam/amber cho nền.

## Shape & depth
- Radius: card `rounded-3xl` (24px) ; chip/stat `rounded-2xl` ; nút `rounded-xl`
- Shadow mềm xanh: card `rgba(27,60,120,0.05) 0px 8px 24px` ; chip `rgba(27,60,120,0.05) 0px 6px 18px`
- Border `1px solid #DCE6F4`

## Atmosphere (nền trang)
3 blob tròn `blur ~110px`, màu `#BCD7FF` / `#A7C8FF` / `#CFE0FA`, opacity ~0.45–0.5, đặt ở các góc, trôi nhẹ (CSS `breathe` 17–24s, hoặc framer-motion animate y/x). Phủ thêm grain SVG `opacity 0.035 mix-blend-multiply`.

```jsx
// grain data-uri
"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
```

## Buttons
- Primary: `bg-[#1b61c9]` text trắng `rounded-xl`, shadow `rgba(27,97,201,0.34) 0px 10px 28px`, hover `#254fad`
- Secondary: bg trắng, text `#1b61c9`, border `#DCE6F4`, shadow mềm
- Trên nền tối/gradient xanh: nút trắng chữ xanh + nút viền `bg-white/15 border-white/30`

## Card nhấn (CTA / streak / hero tối)
Gradient xanh ĐẶC (tương phản cao), chữ trắng, blob trắng mờ bên trong:
`linear-gradient(150deg,#3D8BEF,#1b61c9,#1a4fa0)`.
KHÔNG dùng gradient translucent nhạt — chữ trắng sẽ mất nét.

## Motion (framer-motion)
- `fadeUp`: `{opacity:0,y:20} → {opacity:1,y:0}`, dur 0.5, ease `[0.22,0.61,0.36,1]`
- stagger children ~0.07
- hover card: `y:-4..-6` ; `whileTap scale 0.97`
- progress bar/ring: animate `width` / `strokeDashoffset`, dur ~1, delay nhẹ theo index
- Số liệu: count-up khi `inView`

## Components mẫu
- **StatCard**: icon tile (`h-11 rounded-xl`, nền tint màu + fg cùng họ), số `font-display text-2xl`, label inkSoft
- **Progress ring**: SVG, track `#E2ECF9`, stroke `#1b61c9`, % giữa vòng `font-display`
- **CourseCard**: thumb `aspect-video` bo trên, badge category (`bg rgba(27,97,201,0.09)`), title `font-display`, progress bar, nút full-width
- **PostCard / PreviewCard**: avatar + tên + thời gian, title `font-display`, excerpt `line-clamp`, footer like/comment
- **Empty state**: icon trong tile bo tròn tint xanh + text + nút CTA

## Layout
- `max-w-6xl` (dashboard) / `max-w-7xl` (landing grid) `mx-auto px-6`
- Navbar dùng `<MainNavbar/>`: logo trái • nav links giữa • NotificationBell + UserMenu phải ; `sticky top-0` + `backdrop-blur`
- Ngôn ngữ: tiếng Việt, giọng thân thiện ("Chào buổi sáng", "Tiếp tục học nào", "vui hơn mỗi ngày")

## Tham chiếu code trong repo
- Token font: `app/layout.tsx` (Be Vietnam Pro) + `app/globals.css` (`--font-display`)
- Mẫu chuẩn: `app/student/home/page.tsx`
- Landing: `app/page.tsx` + `app/_components/home/*`
