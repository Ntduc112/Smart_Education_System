"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  const [direction, setDirection] = useState(1);

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
        <p className="text-xl font-semibold text-[#181d26]">Bạn đã ôn xong tất cả!</p>
        <p className="text-sm text-[rgba(4,14,32,0.55)]">Không còn flashcard nào cần ôn tập.</p>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { setRemembered(new Set()); setIndex(0); setFlipped(false); }}
          className="px-5 py-2.5 bg-[#1b61c9] text-white text-sm font-medium rounded-xl hover:bg-[#254fad] transition-colors"
        >
          Ôn lại từ đầu
        </motion.button>
      </motion.div>
    );
  }

  const originalIndex = cards.indexOf(card);

  const handleRemember = () => {
    setDirection(1);
    setRemembered((prev) => new Set([...prev, originalIndex]));
    setFlipped(false);
    if (index >= remaining.length - 1) setIndex(0);
  };

  const handleNext = () => {
    setDirection(1);
    setFlipped(false);
    setIndex((i) => (i + 1) % remaining.length);
  };

  const progress = ((cards.length - remaining.length) / cards.length) * 100;

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-6"
      >
        <p className="text-sm text-[rgba(4,14,32,0.55)]">
          Còn lại: <span className="font-semibold text-[#181d26]">{remaining.length}</span> / {cards.length} thẻ
        </p>
        <div className="w-40 h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#1b61c9] rounded-full"
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
        className="text-xs text-[rgba(4,14,32,0.45)] mb-3 text-center"
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
            className="absolute inset-0 rounded-2xl border border-[#e0e2e6] bg-white flex flex-col items-center justify-center p-8 shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs font-semibold text-[#1b61c9] uppercase tracking-widest mb-4">Câu hỏi</p>
            <p className="text-base font-medium text-[#181d26] text-center leading-relaxed">{card.question}</p>
            <p className="text-xs text-[rgba(4,14,32,0.35)] mt-6">Nhấn để xem đáp án</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border border-[#1b61c9]/20 bg-[#f0f4fc] flex flex-col items-center justify-center p-8 shadow-sm"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-xs font-semibold text-[#1b61c9] uppercase tracking-widest mb-4">Đáp án đúng</p>
            <p className="text-lg font-semibold text-[#1b61c9] text-center">{card.correct_answer}</p>
            {card.your_answer && (
              <p className="text-xs text-[rgba(4,14,32,0.45)] mt-4 text-center">
                Bạn đã trả lời: <span className="text-red-500 font-medium">{card.your_answer}</span>
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
        className="flex gap-3 mt-6"
      >
        <motion.button
          whileHover={{ scale: 1.02, borderColor: "rgba(27,97,201,0.4)" }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="flex-1 py-3 rounded-xl border border-[#e0e2e6] bg-white text-sm font-medium text-[rgba(4,14,32,0.65)] hover:text-[#181d26] transition-colors"
        >
          Tiếp theo
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRemember}
          className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
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
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3 mb-8"
        >
          <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.9 }}>
            <Link
              href="/student/dashboard"
              className="p-2 rounded-xl hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>
          </motion.div>
          <div>
            <h1 className="text-2xl font-semibold text-[#181d26]">Flashcard ôn tập</h1>
            <p className="text-sm text-[rgba(4,14,32,0.55)] mt-0.5">Các câu hỏi bạn đã trả lời sai</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="bg-white border border-[#e0e2e6] rounded-2xl py-20 flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.26, 0.64, 1] as const }}
              className="text-4xl"
            >
              ✅
            </motion.div>
            <p className="text-base font-semibold text-[#181d26]">Chưa có flashcard nào</p>
            <p className="text-sm text-[rgba(4,14,32,0.55)] text-center max-w-sm">
              Hoàn thành một số bài quiz để tạo flashcard từ những câu trả lời sai.
            </p>
          </motion.div>
        ) : (
          <FlashcardView cards={cards} />
        )}
      </div>
    </div>
  );
}
