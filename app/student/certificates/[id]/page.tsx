"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { Atmosphere } from "@/app/student/_components/Atmosphere";
import { BackButton } from "@/app/student/_components/BackButton";
import api from "@/lib/axios";

const C = {
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  blueDark: "#254fad",
  canvas: "#EFF5FE",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

interface Certificate {
  id: string;
  certificate_no: string;
  issued_at: string;
  course: { title: string; instructor: { name: string } };
  user: { name: string };
}

function useCertificate(id: string) {
  return useQuery({
    queryKey: ["certificate-detail", id],
    queryFn: async () => {
      const res = await api.get(`/student/certificates/${id}`);
      return res.data.certificate as Certificate;
    },
  });
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: cert, isLoading } = useCertificate(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.canvas }}>
        <div className="w-8 h-8 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: C.canvas }}>
        <p style={{ color: C.inkSoft }}>Không tìm thấy chứng chỉ</p>
        <Link href="/student/certificates" className="text-sm hover:underline" style={{ color: C.blue }}>
          Quay lại danh sách chứng chỉ
        </Link>
      </div>
    );
  }

  const issuedDate = new Date(cert.issued_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: C.canvas, color: C.ink }}>
      <div className="print:hidden"><Atmosphere /></div>

      <div className="print:hidden mb-6 flex items-center gap-3">
        <BackButton href="/student/certificates" label="Danh sách chứng chỉ" />
        <motion.button
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => window.print()}
          className="mb-5 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors hover:bg-[#254fad]"
          style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          In chứng chỉ
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        className="w-full max-w-2xl bg-white rounded-3xl ring-1 ring-[#1b61c9]/15 outline outline-8 outline-[#EAF1FC] px-10 py-12 flex flex-col items-center text-center"
        style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
      >
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="w-full flex flex-col items-center"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="font-display text-2xl font-extrabold text-[#1b61c9] tracking-tight">Learnust</span>
          </motion.div>

          <motion.div variants={fadeUp} className="w-16 h-px bg-[#DCE6F4] mb-6" />

          <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(4,14,32,0.45)] mb-3">
            Chứng nhận
          </motion.p>

          <motion.h1 variants={fadeUp} className="font-display text-2xl font-bold text-[#181d26] tracking-tight mb-6">
            CHỨNG CHỈ HOÀN THÀNH
          </motion.h1>

          <motion.p variants={fadeUp} className="text-sm text-[rgba(4,14,32,0.55)] mb-3">
            Chứng nhận rằng
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="font-display text-3xl font-bold text-[#181d26] mb-4 tracking-tight"
          >
            {cert.user.name}
          </motion.p>

          <motion.p variants={fadeUp} className="text-sm text-[rgba(4,14,32,0.55)] mb-3">
            đã hoàn thành xuất sắc khóa học
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="font-display text-xl font-semibold text-[#1b61c9] mb-4 leading-snug px-4"
          >
            {cert.course.title}
          </motion.p>

          <motion.p variants={fadeUp} className="text-sm text-[rgba(4,14,32,0.55)] mb-8">
            Giảng viên: <span className="font-medium text-[#181d26]">{cert.course.instructor.name}</span>
          </motion.p>

          <motion.div variants={fadeUp} className="w-16 h-px bg-[#DCE6F4] mb-6" />

          <motion.p variants={fadeUp} className="text-sm text-[rgba(4,14,32,0.55)] mb-1">
            Ngày cấp
          </motion.p>
          <motion.p variants={fadeUp} className="text-sm font-medium text-[#181d26] mb-8">
            {issuedDate}
          </motion.p>

          <motion.div variants={fadeUp} className="w-full flex justify-center">
            <span className="text-xs text-[rgba(4,14,32,0.35)] tracking-widest font-mono">
              {cert.certificate_no}
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
