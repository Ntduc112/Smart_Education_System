"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Users } from "lucide-react";
import { MainNavbar } from "@/app/_components/MainNavbar";
import { Atmosphere } from "@/app/student/_components/Atmosphere";
import { BackButton } from "@/app/student/_components/BackButton";
import { WishlistButton } from "@/app/_components/WishlistButton";
import { useMe } from "@/app/student/dashboard/dashboard.hook";
import { useWishlist, WishlistItem } from "./wishlist.hook";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

const C = {
  ink: "#181d26",
  inkSoft: "rgba(4,14,32,0.62)",
  inkFaint: "rgba(4,14,32,0.40)",
  border: "#DCE6F4",
  blue: "#1b61c9",
  emerald: "#0E9F6E",
  canvas: "#EFF5FE",
};
const CARD_SHADOW = "rgba(27,60,120,0.05) 0px 8px 24px";

function formatPrice(price: string) {
  const n = parseFloat(price);
  if (n === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function WishlistCard({ item }: { item: WishlistItem }) {
  const { course } = item;
  const isFree = parseFloat(course.price) === 0;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, boxShadow: "rgba(27,60,120,0.14) 0px 16px 40px", transition: { duration: 0.2 } }}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white"
      style={{ border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}
    >
      <div className="absolute right-3 top-3 z-10">
        <WishlistButton courseId={course.id} isWishlisted={true} isLoggedIn={true} size="sm" />
      </div>

      <Link href={`/courses/${course.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-video overflow-hidden" style={{ background: "#E7EFFB" }}>
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isFree && (
            <div className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
              style={{ background: C.emerald }}>
              Miễn phí
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ color: C.blue, background: "rgba(27,97,201,0.09)" }}>
              {course.category.name}
            </span>
            <span className="rounded-full px-2.5 py-1 text-xs" style={{ color: C.inkSoft, background: "#EAF1FC" }}>
              {LEVEL_LABEL[course.level] ?? course.level}
            </span>
          </div>

          <h3 className="mb-3 line-clamp-2 font-display text-[17px] font-semibold leading-snug transition-colors group-hover:text-[#1b61c9]"
            style={{ color: C.ink }}>
            {course.title}
          </h3>

          <div className="mb-4 flex items-center gap-2">
            {course.instructor.avatar ? (
              <img src={course.instructor.avatar} alt={course.instructor.name} className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <div className="grid h-5 w-5 place-items-center rounded-full" style={{ background: "rgba(27,97,201,0.15)" }}>
                <span className="text-[9px] font-bold" style={{ color: C.blue }}>{course.instructor.name.charAt(0)}</span>
              </div>
            )}
            <span className="truncate text-sm" style={{ color: C.inkSoft }}>{course.instructor.name}</span>
          </div>

          <div className="mt-auto flex items-center justify-between border-t pt-4" style={{ borderColor: "#EAF1FC" }}>
            <span className="flex items-center gap-1 text-xs" style={{ color: C.inkFaint }}>
              <Users size={13} />
              {course._count.enrollments.toLocaleString("vi-VN")}
            </span>
            <span className="text-sm font-semibold" style={{ color: isFree ? C.emerald : C.ink }}>
              {formatPrice(course.price)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl bg-white" style={{ border: `1px solid ${C.border}` }}>
      <div className="aspect-video" style={{ background: "#E7EFFB" }} />
      <div className="space-y-3 p-5">
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full" style={{ background: "#E2ECF9" }} />
          <div className="h-5 w-14 rounded-full" style={{ background: "#E2ECF9" }} />
        </div>
        <div className="h-4 w-full rounded" style={{ background: "#E2ECF9" }} />
        <div className="h-4 w-3/4 rounded" style={{ background: "#E2ECF9" }} />
        <div className="h-10 w-full rounded-xl" style={{ background: "#E2ECF9" }} />
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { data: user } = useMe();
  const { data: wishlist, isLoading } = useWishlist(!!user);

  return (
    <div className="min-h-screen" style={{ background: C.canvas, color: C.ink }}>
      <Atmosphere />
      <MainNavbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <BackButton />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-8"
        >
          <div className="mb-3 flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "rgba(27,97,201,0.10)", color: C.blue }}>
            <Heart size={13} /> Danh sách của bạn
          </div>
          <h1 className="font-display text-[32px] font-light leading-tight">
            Khóa học <span className="font-semibold" style={{ color: C.blue }}>yêu thích</span>
            {wishlist && wishlist.length > 0 && (
              <span className="ml-2 text-lg font-normal" style={{ color: C.inkFaint }}>({wishlist.length})</span>
            )}
          </h1>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : wishlist && wishlist.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            {wishlist.map((item) => (
              <WishlistCard key={item.course_id} item={item} />
            ))}
          </motion.div>
        ) : (
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
              <Heart size={28} style={{ color: C.blue }} />
            </motion.div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold">Bạn chưa lưu khóa học nào</p>
              <p className="mt-1 text-sm" style={{ color: C.inkSoft }}>Khám phá các khóa học và nhấn ★ để lưu lại.</p>
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/courses" className="rounded-xl px-5 py-2.5 text-sm font-medium text-white"
                style={{ background: C.blue, boxShadow: "rgba(27,97,201,0.34) 0px 10px 28px" }}>
                Khám phá khóa học
              </Link>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
