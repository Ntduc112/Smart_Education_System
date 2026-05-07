"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface WishlistCourse {
  id: string;
  title: string;
  thumbnail: string;
  price: string;
  level: string;
  status: string;
  instructor: { name: string; avatar: string | null };
  category: { name: string };
  _count: { enrollments: number };
}

export interface WishlistItem {
  course_id: string;
  course: WishlistCourse;
}

export function useWishlist(enabled = true) {
  return useQuery<WishlistItem[]>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/student/wishlist");
      return res.data.wishlist;
    },
    enabled,
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      api.post("/student/wishlist", { course_id: courseId }),
    onMutate: async (courseId) => {
      await qc.cancelQueries({ queryKey: ["wishlist"] });
      const prev = qc.getQueryData<WishlistItem[]>(["wishlist"]);
      qc.setQueryData<WishlistItem[]>(["wishlist"], (old) => {
        if (!old) return old;
        const isWishlisted = old.some((w) => w.course_id === courseId);
        if (isWishlisted) return old.filter((w) => w.course_id !== courseId);
        return old;
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["wishlist"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
