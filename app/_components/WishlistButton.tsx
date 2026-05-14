"use client";

import { useRouter } from "next/navigation";
import { useToggleWishlist } from "@/app/student/wishlist/wishlist.hook";

export function WishlistButton({
  courseId,
  isWishlisted,
  isLoggedIn,
  size = "md",
}: {
  courseId: string;
  isWishlisted: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const toggle = useToggleWishlist();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    toggle.mutate(courseId);
  };

  const dim = size === "sm" ? 16 : 20;

  return (
    <button
      onClick={handleClick}
      disabled={toggle.isPending}
      title={isWishlisted ? "Bỏ khỏi danh sách yêu thích" : "Lưu khóa học"}
      className={`flex items-center justify-center rounded-full transition-all disabled:opacity-60 ${
        size === "sm"
          ? "w-7 h-7 bg-white/90 shadow hover:bg-white"
          : "w-9 h-9 bg-white border border-[#e0e2e6] hover:border-[#f59e0b] hover:bg-[#fffbeb]"
      }`}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill={isWishlisted ? "#f59e0b" : "none"}
        stroke={isWishlisted ? "#f59e0b" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isWishlisted ? "" : "text-[rgba(4,14,32,0.45)]"}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}
