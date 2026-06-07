"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const FEATURES = [
  { icon: "🤖", color: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.2)", title: "AI Tutor cá nhân", desc: "Giải đáp mọi thắc mắc 24/7 với trợ lý AI được đào tạo chuyên sâu theo từng khóa học." },
  { icon: "📊", color: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.2)", title: "Theo dõi tiến độ", desc: "Hệ thống phân tích thông minh giúp bạn biết chính xác mình đang ở đâu và cần học gì tiếp theo." },
  { icon: "🎯", color: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.2)", title: "Quiz thích ứng", desc: "Bài kiểm tra tự điều chỉnh độ khó theo năng lực, giúp củng cố kiến thức tối ưu." },
  { icon: "🎓", color: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.2)", title: "Giáo viên chất lượng", desc: "Đội ngũ giảng viên được kiểm duyệt kỹ, đảm bảo nội dung chuẩn và cập nhật." },
  { icon: "📱", color: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.2)", title: "Học mọi lúc mọi nơi", desc: "Giao diện tối ưu trên mọi thiết bị, hỗ trợ tải video offline để học không cần mạng." },
  { icon: "🏆", color: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.2)", title: "Chứng chỉ hoàn thành", desc: "Nhận chứng chỉ được công nhận khi hoàn thành khóa học, nâng cao hồ sơ nghề nghiệp." },
];

function FeatureCard({ feat, index }: { feat: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      className="group relative rounded-2xl p-6 border border-[#e4eaf5] bg-white overflow-hidden transition-colors hover:bg-[#f8faff] hover:border-blue-100 cursor-default"
    >
      {/* Colored glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse 80% 60% at 20% 20%, ${feat.color}, transparent)` }}
      />

      <motion.div
        className="relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5"
        style={{ background: feat.color, border: `1px solid ${feat.border}` }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        {feat.icon}
      </motion.div>

      <h3 className="relative text-base font-semibold text-[#181d26] mb-2">{feat.title}</h3>
      <p className="relative text-sm text-[rgba(4,14,32,0.60)] leading-relaxed">{feat.desc}</p>
    </motion.div>
  );
}

export function FeaturesSection() {
  const headingRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headingRef, { once: true, margin: "-80px" });

  return (
    <section id="features" className="py-24 px-8 bg-[#f0f4ff]/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
            Tính năng nổi bật
          </span>
          <h2 className="text-4xl font-semibold text-[#181d26] mb-3">Tại sao chọn SmartEdu?</h2>
          <p className="text-[rgba(4,14,32,0.55)]">Tất cả những gì bạn cần để học tập hiệu quả</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feat, i) => (
            <FeatureCard key={feat.title} feat={feat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
