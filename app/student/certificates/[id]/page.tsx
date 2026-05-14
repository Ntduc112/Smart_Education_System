"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/axios";

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

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: cert, isLoading } = useCertificate(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4">
        <p className="text-[rgba(4,14,32,0.55)]">Không tìm thấy chứng chỉ</p>
        <Link href="/student/certificates" className="text-sm text-[#1b61c9] hover:underline">
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-4 py-12">
      <div className="print:hidden mb-6 flex items-center gap-4">
        <Link
          href="/student/certificates"
          className="text-sm text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Danh sách chứng chỉ
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          In chứng chỉ
        </button>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl ring-4 ring-[#1b61c9]/20 outline outline-8 outline-[#f0f4fc] shadow-lg px-10 py-12 flex flex-col items-center text-center">
        <div className="mb-6">
          <span className="text-2xl font-extrabold text-[#1b61c9] tracking-tight">SmartEdu</span>
        </div>

        <div className="w-16 h-px bg-[#e0e2e6] mb-6" />

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(4,14,32,0.45)] mb-3">
          Chứng nhận
        </p>

        <h1 className="text-2xl font-bold text-[#181d26] tracking-tight mb-6">
          CHỨNG CHỈ HOÀN THÀNH
        </h1>

        <p className="text-sm text-[rgba(4,14,32,0.55)] mb-3">Chứng nhận rằng</p>

        <p className="text-3xl font-bold text-[#181d26] mb-4 tracking-tight">
          {cert.user.name}
        </p>

        <p className="text-sm text-[rgba(4,14,32,0.55)] mb-3">
          đã hoàn thành xuất sắc khóa học
        </p>

        <p className="text-xl font-semibold text-[#1b61c9] mb-4 leading-snug px-4">
          {cert.course.title}
        </p>

        <p className="text-sm text-[rgba(4,14,32,0.55)] mb-8">
          Giảng viên: <span className="font-medium text-[#181d26]">{cert.course.instructor.name}</span>
        </p>

        <div className="w-16 h-px bg-[#e0e2e6] mb-6" />

        <p className="text-sm text-[rgba(4,14,32,0.55)] mb-1">Ngày cấp</p>
        <p className="text-sm font-medium text-[#181d26] mb-8">{issuedDate}</p>

        <div className="w-full flex justify-center">
          <span className="text-xs text-[rgba(4,14,32,0.35)] tracking-widest font-mono">
            {cert.certificate_no}
          </span>
        </div>
      </div>
    </div>
  );
}
