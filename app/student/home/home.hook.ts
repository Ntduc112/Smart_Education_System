import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

// Reuse the existing dashboard data layer so this page stays in sync with it.
export {
  useMe,
  useStudentCourses,
  useCoursesProgress,
  useStreak,
} from "../dashboard/dashboard.hook";
export type { Me, StudentCourse, CourseProgress } from "../dashboard/dashboard.hook";

// ── Extra collections (used for friendly counts + achievements strip) ────────

export interface Certificate {
  id: string;
  issued_at: string;
  course: { title: string; thumbnail: string | null; instructor: { name: string } };
}

export function useCertificates() {
  return useQuery<Certificate[]>({
    queryKey: ["student", "certificates"],
    queryFn: async () => (await api.get("/student/certificates")).data.certificates,
    staleTime: 60_000,
  });
}

export function useNotesCount() {
  return useQuery<number>({
    queryKey: ["student", "notes", "count"],
    queryFn: async () => ((await api.get("/student/notes")).data.notes ?? []).length,
    staleTime: 60_000,
  });
}

export function useFlashcardsCount() {
  return useQuery<number>({
    queryKey: ["student", "flashcards", "count"],
    queryFn: async () => ((await api.get("/student/flashcards")).data.flashcards ?? []).length,
    staleTime: 60_000,
  });
}

export function useWishlistCount() {
  return useQuery<number>({
    queryKey: ["student", "wishlist", "count"],
    queryFn: async () => ((await api.get("/student/wishlist")).data.wishlist ?? []).length,
    staleTime: 60_000,
  });
}
