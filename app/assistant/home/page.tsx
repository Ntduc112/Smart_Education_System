"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, ClipboardList, DoorOpen, GraduationCap, Users } from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { type AssistantMembership, useAssistantCourses } from "./home.hook";

export default function AssistantHomePage() {
  const { data: memberships = [], isLoading } = useAssistantCourses();

  return (
    <div className="min-h-screen bg-[#EFF5FE] text-[#181d26]">
      <MainNavbar />
      <main className="mx-auto max-w-6xl px-6 py-9">
        <div className="mb-8 rounded-3xl border border-[#DCE6F4] bg-white p-7 shadow-[rgba(80,60,20,0.05)_0px_10px_30px]">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#1b61c9]/10 text-[#1b61c9]"><GraduationCap size={27} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1b61c9]">Không gian trợ giảng</p>
              <h1 className="mt-1 font-display text-2xl font-semibold">Các khóa học bạn đang hỗ trợ</h1>
              <p className="mt-1 text-sm text-[rgba(4,14,32,0.52)]">Mỗi khóa học chỉ mở đúng phần bài giảng hoặc quiz mà giáo viên đã cấp quyền.</p>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center gap-2"><BookOpen size={17} className="text-[#1b61c9]" /><h2 className="font-semibold">Khóa học đang tham gia</h2><span className="rounded-full bg-[#EAF1FC] px-2 py-0.5 text-xs font-semibold text-[#1b61c9]">{memberships.length}</span></div>
          {isLoading ? <div className="h-48 animate-pulse rounded-3xl border border-[#DCE6F4] bg-white" /> : memberships.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#C2D4EE] bg-white px-6 py-14 text-center"><GraduationCap size={30} className="mx-auto text-[#9BB5D8]" /><p className="mt-3 text-sm font-semibold">Chưa có khóa học đang hoạt động</p><p className="mt-1 text-xs text-[rgba(4,14,32,0.45)]">Khi giáo viên thêm bạn vào khóa học, nó sẽ xuất hiện tại đây.</p></div>
          ) : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{memberships.map((item, index) => <CourseCard key={item.id} item={item} eagerImage={index === 0} />)}</div>}
        </section>
      </main>
    </div>
  );
}

function CourseCard({ item, eagerImage }: { item: AssistantMembership; eagerImage: boolean }) {
  return <article className="overflow-hidden rounded-3xl border border-[#DCE6F4] bg-white shadow-[rgba(80,60,20,0.04)_0px_8px_24px]">
    <div className="relative aspect-[16/7] overflow-hidden bg-[#DDE9F8]"><Image src={item.course.thumbnail} alt={item.course.title} fill sizes="(max-width: 768px) 100vw, 420px" preload={eagerImage} className="object-cover" /></div>
    <div className="p-5">
      <p className="text-xs text-[rgba(4,14,32,0.45)]">Giảng viên {item.course.instructor.name}</p>
      <h3 className="mt-1 line-clamp-2 font-semibold">{item.course.title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.can_manage_lessons && <PermissionPill icon={<BookOpen size={12} />} label="Bài giảng" />}
        {item.can_manage_quizzes && <PermissionPill icon={<ClipboardList size={12} />} label="Quiz" />}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-[rgba(4,14,32,0.48)]"><span className="flex items-center gap-1"><BookOpen size={13} />{item.course._count.sections} chương</span><span className="flex items-center gap-1"><Users size={13} />{item.course._count.enrollments} học viên</span></div>
      <div className="mt-5 flex flex-col gap-2">
        <Link href={`/teacher/courses/${item.course.id}/classroom`} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1b61c9] py-2.5 text-sm font-semibold text-white hover:bg-[#254fad]"><DoorOpen size={14} />Vào lớp học</Link>
        <Link href={`/teacher/courses/${item.course.id}/edit`} className="flex w-full items-center justify-center rounded-xl border border-[#1b61c9]/25 bg-[#EAF1FC] py-2.5 text-sm font-semibold text-[#1b61c9] hover:bg-[#DDEAFB]">Mở không gian làm việc</Link>
        {item.can_manage_quizzes && (
          <Link href={`/teacher/courses/${item.course.id}/essays`} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#DCE6F4] py-2.5 text-sm font-semibold text-[#181d26] hover:bg-[#F4F8FE]"><ClipboardList size={14} />Chấm tự luận</Link>
        )}
      </div>
    </div>
  </article>;
}

function PermissionPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF1FC] px-2.5 py-1 text-xs font-medium text-[#1b61c9]">{icon}{label}</span>;
}
