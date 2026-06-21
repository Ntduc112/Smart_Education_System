"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layers, Check } from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { Atmosphere } from "@/app/student/_components/Atmosphere";
import { BackButton } from "@/app/student/_components/BackButton";
import api from "@/lib/axios";

interface Flashcard {
  id: string;
  question: string;
  correct_answer: string;
  your_answer: string;
  quiz_title: string;
  lesson_title: string;
  course_title: string;
}

const C = {
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
  emerald: "#0E9F6E",
  canvas: "#EFF5FE",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

function useFlashcards() {
  return useQuery<{ flashcards: Flashcard[] }>({
    queryKey: ["student", "flashcards"],
    queryFn: () => api.get("/student/flashcards").then((r) => r.data),
  });
}

function FlashcardView({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [remembered, setRemembered] = useState<Set<number>>(new Set());

  const remaining = cards.filter((_, i) => !remembered.has(i));
  const card = remaining[index % Math.max(1, remaining.length)];

  if (!card) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.26, 0.64, 1] as const }}
        className="flex flex-col items-center gap-4 py-20"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8 }}
          className="text-5xl"
        >
          🎉
        </motion.div>
        <p className="font-display text-xl font-semibold" style={{ color: C.ink }}>Bạn đã ôn xong tất cả!</p>
        <p className="text-sm" style={{ color: C.inkSoft }}>Không còn flashcard nào cần ôn tập.</p>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { setRemembered(new Set()); setIndex(0); setFlipped(false); }}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#254fad]"
          style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}
        >
          Ôn lại từ đầu
        </motion.button>
      </motion.div>
    );
  }

  const originalIndex = cards.indexOf(card);

  const handleRemember = () => {
    setRemembered((prev) => new Set([...prev, originalIndex]));
    setFlipped(false);
    if (index >= remaining.length - 1) setIndex(0);
  };

  const handleNext = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % remaining.length);
  };

  const progress = ((cards.length - remaining.length) / cards.length) * 100;

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex items-center justify-between"
      >
        <p className="text-sm" style={{ color: C.inkSoft }}>
          Còn lại: <span className="font-semibold" style={{ color: C.ink }}>{remaining.length}</span> / {cards.length} thẻ
        </p>
        <div className="h-1.5 w-40 overflow-hidden rounded-full" style={{ background: "#E2ECF9" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: C.blue }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          />
        </div>
      </motion.div>

      {/* Source */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-3 text-center text-xs"
        style={{ color: C.inkFaint }}
      >
        {card.course_title} · {card.lesson_title} · {card.quiz_title}
      </motion.p>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        onClick={() => setFlipped((v) => !v)}
        className="cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            height: "240px",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white p-8"
            style={{ backfaceVisibility: "hidden", border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: C.blue }}>Câu hỏi</p>
            <p className="text-center text-base font-medium leading-relaxed" style={{ color: C.ink }}>{card.question}</p>
            <p className="mt-6 text-xs" style={{ color: C.inkFaint }}>Nhấn để xem đáp án</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-8"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#EAF1FC", border: "1px solid rgba(27,97,201,0.2)" }}
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: C.blue }}>Đáp án đúng</p>
            <p className="text-center text-lg font-semibold" style={{ color: C.blue }}>{card.correct_answer}</p>
            {card.your_answer && (
              <p className="mt-4 text-center text-xs" style={{ color: C.inkSoft }}>
                Bạn đã trả lời: <span className="font-medium text-red-500">{card.your_answer}</span>
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="flex-1 rounded-xl bg-white py-3 text-sm font-medium transition-colors"
          style={{ border: `1px solid ${C.border}`, color: C.inkSoft }}
        >
          Tiếp theo
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRemember}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white transition-colors"
          style={{ background: C.emerald }}
        >
          <Check size={15} strokeWidth={2.5} />
          Đã nhớ
        </motion.button>
      </motion.div>
    </div>
  );
}

export default function FlashcardsPage() {
  const { data, isLoading } = useFlashcards();
  const cards = data?.flashcards ?? [];

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
          <div className="mb-3 flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "rgba(27,97,201,0.10)", color: C.blue }}>
            <Layers size={13} /> Ôn tập thông minh
          </div>
          <h1 className="font-display text-[32px] font-light leading-tight">
            Flashcard <span className="font-semibold" style={{ color: C.blue }}>ôn tập</span>
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: C.inkSoft }}>Các câu hỏi bạn đã trả lời sai — lật thẻ để ghi nhớ.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1b61c9] border-t-transparent" />
          </div>
        ) : cards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4 rounded-3xl bg-white py-20"
            style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.26, 0.64, 1] as const }}
              className="grid h-16 w-16 place-items-center rounded-2xl"
              style={{ background: "rgba(27,97,201,0.08)" }}
            >
              <Layers size={28} style={{ color: C.blue }} />
            </motion.div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold">Chưa có flashcard nào</p>
              <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: C.inkSoft }}>
                Hoàn thành một số bài quiz để tạo flashcard từ những câu trả lời sai.
              </p>
            </div>
          </motion.div>
        ) : (
          <FlashcardView cards={cards} />
        )}
      </main>
    </div>
  );
}
