"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layers, Shuffle, ChevronRight, AlertCircle } from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { Atmosphere } from "@/app/student/_components/Atmosphere";
import { BackButton } from "@/app/student/_components/BackButton";
import { useFlashcardCourses } from "./flashcards.hook";

const C = {
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
  danger: "#e53e3e",
  canvas: "#EFF5FE",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] as const } },
};

export default function FlashcardsHomePage() {
  const { data, isLoading } = useFlashcardCourses();
  const courses = data?.courses ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <div
            className="mb-3 flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "rgba(27,97,201,0.10)", color: C.blue }}
          >
            <Layers size={13} /> Ôn tập thông minh
          </div>
          <h1 className="font-display text-[32px] font-light leading-tight">
            Flashcard <span className="font-semibold" style={{ color: C.blue }}>ôn tập</span>
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: C.inkSoft }}>
            Chọn khóa học để ôn những câu bạn từng trả lời sai, hoặc trộn tất cả để ôn ngẫu nhiên.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1b61c9] border-t-transparent" />
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4 rounded-3xl bg-white py-20"
            style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
          >
            <div className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "rgba(27,97,201,0.08)" }}>
              <Layers size={28} style={{ color: C.blue }} />
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold">Chưa có flashcard nào</p>
              <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: C.inkSoft }}>
                Hoàn thành một số bài quiz để tạo flashcard từ những câu trả lời sai.
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Shuffle-all CTA */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Link
                href="/student/flashcards/all"
                className="group mb-6 flex items-center gap-4 rounded-3xl p-5 text-white transition-transform hover:scale-[1.01]"
                style={{ background: "linear-gradient(150deg,#3D8BEF,#1b61c9,#1a4fa0)", boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
                  <Shuffle size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-display text-lg font-semibold">Trộn tất cả</p>
                  <p className="text-sm text-white/75">Ôn ngẫu nhiên {total} thẻ từ mọi khóa học</p>
                </div>
                <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Per-course rows */}
            <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
              {courses.map((c) => (
                <motion.div key={c.course_id} variants={fadeUp}>
                  <Link
                    href={`/student/flashcards/${c.course_id}`}
                    className="group flex items-center gap-4 rounded-2xl bg-white p-4 transition-all hover:scale-[1.01]"
                    style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl" style={{ background: "#E7EFFB" }}>
                      {c.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.thumbnail} alt={c.course_title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <Layers size={20} style={{ color: C.blue }} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium" style={{ color: C.ink }}>{c.course_title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm" style={{ color: C.danger }}>
                        <AlertCircle size={14} />
                        {c.wrong_count} câu cần ôn
                      </p>
                    </div>
                    <ChevronRight size={18} style={{ color: C.inkFaint }} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
