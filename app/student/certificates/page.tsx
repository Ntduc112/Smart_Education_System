"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, ArrowRight } from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { Atmosphere } from "@/app/student/_components/Atmosphere";
import { BackButton } from "@/app/student/_components/BackButton";
import api from "@/lib/axios";

interface CertificateListItem {
  id: string;
  certificate_no: string;
  issued_at: string;
  course: {
    title: string;
    thumbnail: string;
    instructor: { name: string };
  };
}

function useCertificates() {
  return useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const res = await api.get("/student/certificates");
      return res.data.certificates as CertificateListItem[];
    },
  });
}

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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const } },
};
const stagger = (delay = 0.07) => ({ hidden: {}, show: { transition: { staggerChildren: delay } } });

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useCertificates();

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <BackButton />
        <motion.div className="mb-8" initial="hidden" animate="show" variants={stagger(0.06)}>
          <motion.div variants={fadeUp} className="mb-3 flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "rgba(27,97,201,0.10)", color: C.blue }}>
            <Award size={13} /> Thành quả của bạn
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-[32px] font-light leading-tight">
            Chứng chỉ <span className="font-semibold" style={{ color: C.blue }}>của tôi</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-2 text-[15px]" style={{ color: C.inkSoft }}>
            Các khóa học bạn đã hoàn thành và nhận chứng chỉ.
          </motion.p>
        </motion.div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1b61c9] border-t-transparent" />
          </div>
        )}

        {!isLoading && (!certificates || certificates.length === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4 rounded-3xl bg-white py-16"
            style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.26, 0.64, 1] as const }}
              className="grid h-16 w-16 place-items-center rounded-2xl"
              style={{ background: "rgba(27,97,201,0.08)" }}
            >
              <Award size={28} style={{ color: C.blue }} />
            </motion.div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold">Bạn chưa có chứng chỉ nào</p>
              <p className="mt-1 text-sm" style={{ color: C.inkSoft }}>Hoàn thành một khóa học để nhận chứng chỉ đầu tiên!</p>
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/courses" className="rounded-xl px-5 py-2.5 text-sm font-medium text-white"
                style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}>
                Khám phá khóa học
              </Link>
            </motion.div>
          </motion.div>
        )}

        {!isLoading && certificates && certificates.length > 0 && (
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={stagger(0.08)}
          >
            {certificates.map((cert) => (
              <motion.div
                key={cert.id}
                variants={fadeUp}
                whileHover={{ y: -6, boxShadow: "rgba(27,60,120,0.14) 0px 16px 40px", transition: { duration: 0.2 } }}
                className="group flex flex-col overflow-hidden rounded-3xl bg-white"
                style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
              >
                <div className="aspect-video overflow-hidden" style={{ background: "#E7EFFB" }}>
                  {cert.course.thumbnail ? (
                    <img
                      src={cert.course.thumbnail}
                      alt={cert.course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <Award size={32} style={{ color: C.blue }} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-1 line-clamp-2 font-display text-[16px] font-semibold leading-snug" style={{ color: C.ink }}>
                    {cert.course.title}
                  </h3>
                  <p className="mb-4 text-xs" style={{ color: C.inkFaint }}>{cert.course.instructor.name}</p>
                  <div className="mt-auto flex items-center justify-between border-t pt-3" style={{ borderColor: "#EAF1FC" }}>
                    <span className="text-xs" style={{ color: C.inkFaint }}>
                      {new Date(cert.issued_at).toLocaleDateString("vi-VN")}
                    </span>
                    <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.96 }}>
                      <Link
                        href={`/student/certificates/${cert.id}`}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#1b61c9]/8"
                        style={{ color: C.blue }}
                      >
                        Xem chứng chỉ
                        <ArrowRight size={12} />
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
