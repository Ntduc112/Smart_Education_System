"use client";

import Link from "next/link";
import { use } from "react";
import { motion } from "framer-motion";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { ChevronLeft, Route, Check, Users, ArrowRight } from "lucide-react";
import { useRoadmap, type RoadmapCourse } from "../roadmaps.hook";
import { useMe, useStudentCourses } from "@/app/student/dashboard/dashboard.hook";

const C = {
  canvas: "#EFF5FE", card: "#FFFFFF", ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)", inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4", blue: "#1b61c9", emerald: "#0E9F6E", danger: "#e53e3e",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

const LEVEL_LABEL: Record<string, string> = { beginner: "Cơ bản", intermediate: "Trung cấp", advanced: "Nâng cao" };

function fmtVND(price: string) {
  const n = parseFloat(price);
  if (n === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function Atmosphere() {
  const blobs = [
    { c: "#BCD7FF", s: 460, top: "-8%", left: "-6%", dur: 22 },
    { c: "#A7C8FF", s: 400, top: "12%", right: "-8%", dur: 26 },
    { c: "#CFE0FA", s: 360, bottom: "-10%", left: "18%", dur: 30 },
  ] as const;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{
            width: b.s, height: b.s, background: b.c, opacity: 0.28, filter: "blur(90px)",
            top: "top" in b ? b.top : undefined, left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined, bottom: "bottom" in b ? b.bottom : undefined,
          }}
          animate={{ y: [0, -26, 0], x: [0, 16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }} />
      ))}
    </div>
  );
}

function StepCard({ course, index, isEnrolled }: { course: RoadmapCourse; index: number; isEnrolled: boolean }) {
  const isFree = parseFloat(course.price) === 0;
  const href = isEnrolled ? `/student/courses/${course.id}/learn` : `/courses/${course.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="flex gap-4 sm:gap-5"
    >
      {/* Step number + connector */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full text-white text-sm font-semibold flex items-center justify-center shrink-0 font-display"
          style={{ background: isEnrolled ? C.emerald : C.blue }}>
          {isEnrolled ? <Check size={18} /> : index + 1}
        </div>
        <div className="w-px flex-1 my-1.5" style={{ background: "#DBE4F3" }} />
      </div>

      {/* Course card */}
      <Link href={href} className="group flex-1 flex items-center gap-4 rounded-2xl bg-white p-4 mb-4 transition-colors"
        style={isEnrolled
          ? { border: `1.5px solid ${C.blue}`, boxShadow: "rgba(27,97,201,0.12) 0px 6px 20px" }
          : { border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
        <div className="w-28 h-18 sm:w-36 aspect-video rounded-xl overflow-hidden shrink-0" style={{ background: "#E7EFFB" }}>
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ color: C.inkSoft, background: "#EAF1FC" }}>
              {LEVEL_LABEL[course.level] ?? course.level}
            </span>
            {isEnrolled && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: C.blue, background: "rgba(27,97,201,0.10)" }}>
                <Check size={11} /> Đã đăng ký
              </span>
            )}
          </div>
          <h3 className="font-display text-[16px] font-semibold leading-snug line-clamp-1 transition-colors group-hover:text-[#1b61c9]" style={{ color: C.ink }}>
            {course.title}
          </h3>
          <p className="text-[13px] line-clamp-1 mt-0.5" style={{ color: C.inkSoft }}>{course.instructor.name}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center gap-1 text-xs" style={{ color: C.inkFaint }}>
              <Users size={13} /> {course._count.enrollments.toLocaleString("vi-VN")}
            </span>
            {isEnrolled ? (
              <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: C.blue }}>
                Tiếp tục học <ArrowRight size={14} />
              </span>
            ) : isFree ? (
              <span className="text-sm font-semibold" style={{ color: C.emerald }}>Miễn phí</span>
            ) : course.discount_percent ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold" style={{ color: C.danger }}>
                  {fmtVND(String(parseFloat(course.price) * (1 - course.discount_percent / 100)))}
                </span>
                <span className="text-xs line-through" style={{ color: C.inkFaint }}>{fmtVND(course.price)}</span>
              </div>
            ) : (
              <span className="text-sm font-semibold" style={{ color: C.ink }}>{fmtVND(course.price)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function RoadmapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: roadmap, isLoading } = useRoadmap(id);
  const { data: user } = useMe();
  const isLoggedIn = !!user;
  const { data: enrolled = [] } = useStudentCourses({ enabled: isLoggedIn });
  const enrolledIds = new Set(enrolled.map((c) => c.id));

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/roadmaps" className="inline-flex items-center gap-1 text-sm mb-6 transition-colors hover:text-[#1b61c9]" style={{ color: C.inkFaint }}>
          <ChevronLeft size={15} /> Tất cả lộ trình
        </Link>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/2 rounded" style={{ background: "#E2ECF9" }} />
            <div className="h-4 w-3/4 rounded" style={{ background: "#E2ECF9" }} />
            <div className="h-24 w-full rounded-2xl mt-6" style={{ background: "#E2ECF9" }} />
            <div className="h-24 w-full rounded-2xl" style={{ background: "#E2ECF9" }} />
          </div>
        ) : !roadmap ? (
          <div className="rounded-3xl bg-white py-20 text-center text-sm" style={{ border: `1px solid ${C.border}`, color: C.danger }}>
            Không tìm thấy lộ trình.
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(27,97,201,0.10)", color: C.blue }}>
                <Route size={26} />
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold leading-tight" style={{ color: C.ink }}>{roadmap.title}</h1>
                <p className="mt-2" style={{ color: C.inkSoft }}>{roadmap.description}</p>
                <p className="text-sm mt-2" style={{ color: C.inkFaint }}>{roadmap.items.length} khóa học · học theo thứ tự</p>
              </div>
            </div>

            {/* Timeline */}
            {roadmap.items.length === 0 ? (
              <div className="rounded-3xl bg-white py-16 text-center text-sm" style={{ border: `1px solid ${C.border}`, color: C.inkFaint }}>
                Lộ trình này chưa có khóa học nào.
              </div>
            ) : (
              <div>
                {roadmap.items.map((item, i) => (
                  <StepCard key={item.id} course={item.course} index={i} isEnrolled={enrolledIds.has(item.course.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
