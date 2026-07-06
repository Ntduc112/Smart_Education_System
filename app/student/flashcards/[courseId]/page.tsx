"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layers, Check, Shuffle } from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { Atmosphere } from "@/app/student/_components/Atmosphere";
import { BackButton } from "@/app/student/_components/BackButton";
import { Flashcard, useFlashcards, useMarkMastered, useResetMastered } from "../flashcards.hook";

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Viewer({ courseId, cards }: { courseId: string; cards: Flashcard[] }) {
  const [deck, setDeck] = useState<Flashcard[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const mark = useMarkMastered();
  const reset = useResetMastered();

  // Sync from the query: initial load + after a reset refetch (which restores
  // previously-mastered cards). "Đã nhớ" only invalidates the course list, not
  // this cards query, so in-session removals are preserved.
  useEffect(() => {
    setDeck(shuffle(cards));
    setPos(0);
    setFlipped(false);
  }, [cards]);

  const total = cards.length;
  const done = total - deck.length;
  const card = deck[pos];

  const next = () => {
    setFlipped(false);
    setPos((p) => (deck.length ? (p + 1) % deck.length : 0));
  };

  const remember = () => {
    if (!card) return;
    mark.mutate(card.question_id);
    setFlipped(false);
    setDeck((d) => {
      const nd = d.filter((c) => c.question_id !== card.question_id);
      setPos((p) => (nd.length ? p % nd.length : 0));
      return nd;
    });
  };

  const reshuffle = () => {
    setFlipped(false);
    setPos(0);
    setDeck((d) => shuffle(d));
  };

  // Reset invalidates the cards query → refetch → the sync effect re-seeds the deck.
  const onReset = () => reset.mutate(courseId === "all" ? undefined : courseId);

  // Deck emptied — everything mastered this session.
  if (!card) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.26, 0.64, 1] as const }}
        className="flex flex-col items-center gap-4 py-20"
      >
        <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.8 }} className="text-5xl">
          🎉
        </motion.div>
        <p className="font-display text-xl font-semibold" style={{ color: C.ink }}>Bạn đã nhớ hết!</p>
        <p className="text-sm" style={{ color: C.inkSoft }}>Không còn thẻ nào cần ôn trong bộ này.</p>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onReset}
          disabled={reset.isPending}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#254fad] disabled:opacity-60"
          style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}
        >
          {reset.isPending ? "Đang đặt lại..." : "Ôn lại tất cả"}
        </motion.button>
      </motion.div>
    );
  }

  const progress = total ? (done / total) * 100 : 0;

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress + shuffle */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm" style={{ color: C.inkSoft }}>
          Còn lại: <span className="font-semibold" style={{ color: C.ink }}>{deck.length}</span> / {total} thẻ
        </p>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-32 overflow-hidden rounded-full" style={{ background: "#E2ECF9" }}>
            <motion.div className="h-full rounded-full" style={{ background: C.blue }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
          <button
            onClick={reshuffle}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[#EAF1FC]"
            style={{ color: C.blue, border: `1px solid ${C.border}` }}
          >
            <Shuffle size={13} /> Trộn
          </button>
        </div>
      </motion.div>

      {/* Source */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-3 text-center text-xs" style={{ color: C.inkFaint }}>
        {card.course_title} · {card.lesson_title} · {card.quiz_title}
      </motion.p>

      {/* Card */}
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        onClick={() => setFlipped((v) => !v)}
        className="cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", height: "240px" }}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white p-8" style={{ backfaceVisibility: "hidden", border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: C.blue }}>Câu hỏi</p>
            <p className="text-center text-base font-medium leading-relaxed" style={{ color: C.ink }}>{card.question}</p>
            <p className="mt-6 text-xs" style={{ color: C.inkFaint }}>Nhấn để xem đáp án</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-8" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#EAF1FC", border: "1px solid rgba(27,97,201,0.2)" }}>
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={next}
          className="flex-1 rounded-xl bg-white py-3 text-sm font-medium transition-colors"
          style={{ border: `1px solid ${C.border}`, color: C.inkSoft }}
        >
          Tiếp theo
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={remember}
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

export default function CourseFlashcardsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data, isLoading } = useFlashcards(courseId);
  const cards = data?.flashcards ?? [];
  const title = courseId === "all" ? "Tất cả khóa học" : cards[0]?.course_title;

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <BackButton href="/student/flashcards" />

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
          <div className="mb-3 flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium" style={{ background: "rgba(27,97,201,0.10)", color: C.blue }}>
            <Layers size={13} /> {courseId === "all" ? "Trộn tất cả" : "Ôn theo khóa"}
          </div>
          <h1 className="font-display text-[28px] font-light leading-tight">
            {title ? (
              <>Flashcard · <span className="font-semibold" style={{ color: C.blue }}>{title}</span></>
            ) : (
              <>Flashcard <span className="font-semibold" style={{ color: C.blue }}>ôn tập</span></>
            )}
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: C.inkSoft }}>Các câu bạn đã trả lời sai — lật thẻ để ghi nhớ, nhấn “Đã nhớ” để bỏ khỏi bộ.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1b61c9] border-t-transparent" />
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white py-20" style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
            <div className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "rgba(27,97,201,0.08)" }}>
              <Layers size={28} style={{ color: C.blue }} />
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold">Không có thẻ nào</p>
              <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: C.inkSoft }}>Bộ này chưa có câu sai nào để ôn.</p>
            </div>
          </div>
        ) : (
          <Viewer courseId={courseId} cards={cards} />
        )}
      </main>
    </div>
  );
}
