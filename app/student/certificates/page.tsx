"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useCertificates();

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#181d26] tracking-tight">Chứng chỉ của tôi</h1>
          <p className="text-sm text-[rgba(4,14,32,0.55)] mt-1">
            Các khóa học bạn đã hoàn thành và nhận chứng chỉ
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && (!certificates || certificates.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-[#1b61c9]/8 rounded-2xl flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b61c9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <p className="text-[rgba(4,14,32,0.55)] text-sm">Bạn chưa có chứng chỉ nào</p>
            <Link
              href="/student/dashboard"
              className="text-sm text-[#1b61c9] hover:underline font-medium"
            >
              Khám phá khóa học
            </Link>
          </div>
        )}

        {!isLoading && certificates && certificates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-xl border border-[#e0e2e6] overflow-hidden hover:shadow-md transition-shadow"
              >
                {cert.course.thumbnail ? (
                  <div className="h-36 overflow-hidden bg-[#f0f4fc]">
                    <img
                      src={cert.course.thumbnail}
                      alt={cert.course.title}
                      className="w-full h-full object-cover"
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
                    <Link
                      href={`/student/certificates/${cert.id}`}
                      className="text-xs font-medium text-[#1b61c9] hover:text-[#254fad] px-3 py-1.5 rounded-lg hover:bg-[#1b61c9]/8 transition-colors flex items-center gap-1"
                    >
                      Xem chứng chỉ
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
