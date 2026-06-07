"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const up = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="px-8 pb-24">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden p-16 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(99,102,241,0.15) 50%, rgba(14,165,233,0.2) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 0 80px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Glow orbs inside card */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="relative"
        >
          <motion.div variants={up}>
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
              🚀 Hơn 10,000 học viên đã tin tưởng
            </span>
          </motion.div>

          <motion.h2 variants={up} className="text-4xl font-semibold text-white mb-4">
            Sẵn sàng bắt đầu hành trình?
          </motion.h2>

          <motion.p variants={up} className="text-white/50 mb-10 max-w-lg mx-auto">
            Tham gia cùng hàng nghìn học viên đang học tập trên SmartEdu. Miễn phí hoàn toàn để bắt đầu.
          </motion.p>

          <motion.div variants={up} className="flex items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/register"
                className="inline-block bg-blue-600 text-white font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-blue-500 transition-colors"
                style={{ boxShadow: "0 0 24px rgba(59,130,246,0.4)" }}
              >
                Đăng ký miễn phí
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/courses"
                className="inline-block bg-white/[0.08] text-white/80 font-semibold text-sm px-8 py-3.5 rounded-xl border border-white/15 hover:bg-white/[0.14] hover:text-white transition-all"
              >
                Xem khóa học
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
