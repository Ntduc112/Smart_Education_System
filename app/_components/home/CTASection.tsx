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
          background: "linear-gradient(150deg,#3D8BEF 0%,#1b61c9 55%,#1a4fa0 100%)",
          boxShadow: "rgba(27,97,201,0.34) 0px 22px 60px",
        }}
      >
        {/* Soft light orbs inside card */}
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-64 h-64 rounded-full bg-sky-300/20 blur-3xl pointer-events-none" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="relative"
        >
          <motion.div variants={up}>
            <span className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-medium px-4 py-1.5 rounded-full mb-6">
              🚀 Hơn 10,000 học viên đã tin tưởng
            </span>
          </motion.div>

          <motion.h2 variants={up} className="font-display text-4xl md:text-5xl font-semibold text-white mb-4">
            Sẵn sàng bắt đầu hành trình?
          </motion.h2>

          <motion.p variants={up} className="text-white/85 mb-10 max-w-lg mx-auto leading-relaxed">
            Tham gia cùng hàng nghìn sinh viên đang học tập trên Learnust. Miễn phí hoàn toàn để bắt đầu.
          </motion.p>

          <motion.div variants={up} className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/register"
                className="inline-block bg-white text-[#1b61c9] font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors"
                style={{ boxShadow: "rgba(0,0,0,0.12) 0px 8px 20px" }}
              >
                Đăng ký miễn phí
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/courses"
                className="inline-block bg-white/15 text-white font-semibold text-sm px-8 py-3.5 rounded-xl border border-white/30 hover:bg-white/25 transition-all"
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
