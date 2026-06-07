"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";

const STATS = [
  { value: 10000, suffix: "+", label: "Học viên" },
  { value: 200, suffix: "+", label: "Khóa học" },
  { value: 4.9, suffix: "★", label: "Đánh giá", decimals: 1 },
  { value: 24, suffix: "/7", label: "AI hỗ trợ" },
];

function CountUp({ to, suffix, decimals = 0 }: { to: number; suffix: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const ctrl = animate(0, to, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => { el.textContent = v.toFixed(decimals) + suffix; },
    });
    return () => ctrl.stop();
  }, [inView, to, suffix, decimals]);

  return <span ref={ref}>0{suffix}</span>;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const up = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } },
};

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Zoom-in entrance wrapper */}
      <motion.div
        initial={{ scale: 1.06, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl mx-auto"
      >
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center">

          {/* Badge */}
          <motion.div variants={up} className="mb-8">
            <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Được hỗ trợ bởi AI · Cá nhân hóa 100%
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={up} className="text-6xl md:text-7xl font-semibold text-[#181d26] leading-[1.1] tracking-tight mb-6">
            Học thông minh hơn
            <br />
            <span className="font-black bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
              với AI cá nhân hóa
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={up} className="text-lg text-[rgba(4,14,32,0.55)] leading-relaxed max-w-lg mb-12">
            Nền tảng giáo dục thông minh hỗ trợ AI Tutor 24/7, giúp bạn học đúng cách, đúng lúc.
          </motion.p>

          {/* CTA */}
          <motion.div variants={up} className="flex items-center gap-4 mb-16">
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-blue-500 transition-colors"
                style={{ boxShadow: "0 0 32px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.3)" }}
              >
                Bắt đầu miễn phí
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 bg-white text-[#1b61c9] font-semibold text-sm px-8 py-3.5 rounded-xl border border-[#dde3f0] hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                Khám phá khóa học
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={up}
            className="flex items-center justify-center gap-0 bg-white border border-[#e4eaf5] rounded-2xl overflow-hidden backdrop-blur-sm divide-x divide-[#e4eaf5] shadow-sm"
          >
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center px-8 py-4">
                <span className="text-2xl font-bold text-[#181d26]">
                  <CountUp to={s.value} suffix={s.suffix} decimals={s.decimals} />
                </span>
                <span className="text-xs text-[rgba(4,14,32,0.5)] mt-0.5">{s.label}</span>
              </div>
            ))}
          </motion.div>

        </motion.div>
      </motion.div>
    </section>
  );
}
