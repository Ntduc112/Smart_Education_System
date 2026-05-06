import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface EssayUser {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
}

export interface EssayAnswer {
    id: string;
    answer: string;
    is_correct: boolean | null;
    ai_feedback: string | null;
    points_earned: number | null;
    question: {
        content: string;
        points: number;
        sample_answer: string | null;
        quiz: { id: string; title: string };
    };
    attempt: {
        submitted_at: string;
        user: EssayUser;
    };
}

export interface EssayQuizGroup {
    id: string;
    title: string;
    answers: EssayAnswer[];
}

export interface EssaysData {
    quizzes: EssayQuizGroup[];
}

export function useEssays(courseId: string, gradedFilter: "all" | "ungraded") {
    return useQuery<EssaysData>({
        queryKey: ["essays", courseId, gradedFilter],
        queryFn: async () => {
            const url =
                gradedFilter === "ungraded"
                    ? `/teacher/courses/${courseId}/essays?graded=false`
                    : `/teacher/courses/${courseId}/essays`;
            return (await api.get<EssaysData>(url)).data;
        },
        enabled: !!courseId,
    });
}

export function useGradeAnswer(courseId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            answerId,
            points_earned,
            feedback,
        }: {
            answerId: string;
            points_earned: number;
            feedback: string;
        }) => {
            const res = await api.patch(`/teacher/essay-answers/${answerId}`, {
                points_earned,
                feedback,
            });
            return res.data.answer;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["essays", courseId] });
        },
    });
}
