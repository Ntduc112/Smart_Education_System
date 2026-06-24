"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { Route, BookOpen, ArrowRight } from "lucide-react";
import { useRoadmaps } from "./roadmaps.hook";

const C = {
  canvas: "#EFF5FE", card: "#FFFFFF", ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)", inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4", blue: "#1b61c9",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const } },
};
const stagger = (d = 0.07) => ({ hidden: {}, show: { transition: { staggerChildren: d } } });

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

function CardSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-6 animate-pulse" style={{ border: `1px solid ${C.border}` }}>
      <div className="w-12 h-12 rounded-2xl mb-4" style={{ background: "#E2ECF9" }} />
      <div className="h-5 w-2/3 rounded mb-2" style={{ background: "#E2ECF9" }} />
      <div className="h-4 w-full rounded mb-1.5" style={{ background: "#E2ECF9" }} />
      <div className="h-4 w-1/2 rounded" style={{ background: "#E2ECF9" }} />
    </div>
  );
}

export default function RoadmapsPage() {
  const { data: roadmaps, isLoading } = useRoadmaps();

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-light mb-3" style={{ color: C.ink }}>
            Lộ trình <span className="font-semibold" style={{ color: C.blue }}>học tập</span>
          </h1>
          <p className="tracking-[0.18px]" style={{ color: C.inkSoft }}>
            Học theo trình tự được sắp xếp sẵn, từ cơ bản đến nâng cao
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (roadmaps?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-20" style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
            <div className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "rgba(27,97,201,0.08)" }}>
              <Route size={26} style={{ color: C.blue }} />
            </div>
            <p className="font-display text-lg font-semibold" style={{ color: C.ink }}>Chưa có lộ trình nào</p>
            <p className="text-sm" style={{ color: C.inkSoft }}>Các lộ trình học sẽ sớm được cập nhật</p>
          </div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={stagger(0.05)}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps!.map((r) => (
              <motion.div key={r.id} variants={fadeUp} whileHover={{ y: -6 }}>
                <Link href={`/roadmaps/${r.id}`}
                  className="group flex flex-col h-full rounded-3xl bg-white p-6 transition-colors"
                  style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(27,97,201,0.10)", color: C.blue }}>
                    <Route size={22} />
                  </div>
                  <h3 className="font-display text-[18px] font-semibold leading-snug mb-2 transition-colors group-hover:text-[#1b61c9]" style={{ color: C.ink }}>
                    {r.title}
                  </h3>
                  <p className="text-sm line-clamp-2 mb-5" style={{ color: C.inkSoft }}>{r.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t" style={{ borderColor: "#EEF3FB" }}>
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: C.inkFaint }}>
                      <BookOpen size={15} /> {r._count.items} khóa học
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: C.blue }}>
                      Xem lộ trình <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
