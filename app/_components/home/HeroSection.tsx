"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";
import { useMe } from "@/app/student/dashboard/dashboard.hook";

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
  const { data: user } = useMe();
  const firstName = user ? user.name.trim().split(" ").pop() : null;
  const dashboardHref = user ? `/${user.role.toLowerCase()}/dashboard` : "/register";

  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 overflow-hidden">
      <motion.div
        initial={{ scale: 1.04, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl mx-auto"
      >
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center">

          {/* Badge */}
          <motion.div variants={up} className="mb-7">
            {user ? (
              <span className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold px-4 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Chào mừng trở lại 👋
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 bg-white border border-[#DCE6F4] text-[#1b61c9] text-xs font-semibold px-4 py-1.5 rounded-full" style={{ boxShadow: "rgba(27,60,120,0.05) 0px 4px 14px" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#1b61c9] animate-pulse" />
                Học cùng AI · Cá nhân hóa 100%
              </span>
            )}
          </motion.div>

          {/* Heading — Fraunces display */}
          {user ? (
            <motion.h1 variants={up} className="font-display text-5xl md:text-7xl font-light text-[#181d26] leading-[1.08] tracking-tight mb-6">
              Tiếp tục học nào,
              <br />
              <span className="font-semibold text-[#1b61c9]">{firstName} 🚀</span>
            </motion.h1>
          ) : (
            <motion.h1 variants={up} className="font-display text-5xl md:text-7xl font-light text-[#181d26] leading-[1.08] tracking-tight mb-6">
              Học thông minh hơn,
              <br />
              <span className="font-semibold text-[#1b61c9]">vui hơn mỗi ngày</span>
            </motion.h1>
          )}

          {/* Sub */}
          <motion.p variants={up} className="text-lg text-[rgba(4,14,32,0.6)] leading-relaxed max-w-xl mb-11">
            {user
              ? "Hành trình học tập của bạn đang chờ. Vào khu vực học để tiếp tục cùng AI Tutor."
              : "Nền tảng học tập dành cho sinh viên: AI Tutor 24/7, lộ trình cá nhân hóa và một cộng đồng cùng nhau tiến bộ."}
          </motion.p>

          {/* CTA */}
          <motion.div variants={up} className="flex flex-col sm:flex-row items-center gap-3.5 mb-14">
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 bg-[#1b61c9] text-white font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-[#254fad] transition-colors"
                style={{ boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}
              >
                {user ? "Vào khu vực học" : "Bắt đầu miễn phí"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 bg-white text-[#1b61c9] font-semibold text-sm px-8 py-3.5 rounded-xl border border-[#DCE6F4] hover:border-blue-300 hover:bg-blue-50 transition-all"
                style={{ boxShadow: "rgba(27,60,120,0.05) 0px 6px 18px" }}
              >
                Khám phá khóa học
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats — soft cards */}
          <motion.div variants={up} className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-2xl">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-2xl bg-white border border-[#DCE6F4] px-4 py-4"
                style={{ boxShadow: "rgba(27,60,120,0.05) 0px 6px 18px" }}
              >
                <span className="font-display text-3xl font-semibold text-[#181d26]">
                  <CountUp to={s.value} suffix={s.suffix} decimals={s.decimals} />
                </span>
                <span className="text-xs text-[rgba(4,14,32,0.55)] mt-1">{s.label}</span>
              </div>
            ))}
          </motion.div>

        </motion.div>
      </motion.div>
    </section>
  );
}
