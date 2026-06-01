"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const stagger = (delay = 0.07) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
});

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useCertificates();

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="mb-8"
          initial="hidden"
          animate="show"
          variants={stagger(0.06)}
        >
          <motion.h1 variants={fadeUp} className="text-2xl font-bold text-[#181d26] tracking-tight">
            Chứng chỉ của tôi
          </motion.h1>
          <motion.p variants={fadeUp} className="text-sm text-[rgba(4,14,32,0.55)] mt-1">
            Các khóa học bạn đã hoàn thành và nhận chứng chỉ
          </motion.p>
        </motion.div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && (!certificates || certificates.length === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.26, 0.64, 1] as const }}
              className="w-16 h-16 bg-[#1b61c9]/8 rounded-2xl flex items-center justify-center"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-[rgba(4,14,32,0.55)] text-sm"
            >
              Bạn chưa có chứng chỉ nào
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/student/dashboard" className="text-sm text-[#1b61c9] hover:underline font-medium">
                Khám phá khóa học
              </Link>
            </motion.div>
          </motion.div>
        )}

        {!isLoading && certificates && certificates.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            animate="show"
            variants={stagger(0.08)}
          >
            {certificates.map((cert) => (
              <motion.div
                key={cert.id}
                variants={fadeUp}
                whileHover={{
                  y: -5,
                  boxShadow: "rgba(15,48,106,0.14) 0px 12px 32px",
                  transition: { duration: 0.2, ease: "easeOut" as const },
                }}
                className="bg-white rounded-xl border border-[#e0e2e6] overflow-hidden"
              >
                {cert.course.thumbnail ? (
                  <div className="h-36 overflow-hidden bg-[#f0f4fc]">
                    <motion.img
                      src={cert.course.thumbnail}
                      alt={cert.course.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.05, transition: { duration: 0.4 } }}
                    />
                  </div>
                ) : (
                  <div className="h-36 bg-[#f0f4fc] flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm font-semibold text-[#181d26] line-clamp-2 leading-snug mb-1">
                    {cert.course.title}
                  </p>
                  <p className="text-xs text-[rgba(4,14,32,0.45)] mb-3">
                    {cert.course.instructor.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgba(4,14,32,0.35)]">
                      {new Date(cert.issued_at).toLocaleDateString("vi-VN")}
                    </span>
                    <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.96 }}>
                      <Link
                        href={`/student/certificates/${cert.id}`}
                        className="text-xs font-medium text-[#1b61c9] hover:text-[#254fad] px-3 py-1.5 rounded-lg hover:bg-[#1b61c9]/8 transition-colors flex items-center gap-1"
                      >
                        Xem chứng chỉ
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
