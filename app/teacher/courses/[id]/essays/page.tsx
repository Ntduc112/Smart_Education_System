"use client";

import { use, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, ChevronLeft } from "lucide-react";
import { Breadcrumb } from "@/app/teacher/_components/Breadcrumb";
import { useTeacherCourses } from "@/app/teacher/courses/courses.hook";
import { useEssays, useGradeAnswer, useAIGrade, EssayAnswer } from "./essays.hook";
import { gradeAnswerSchema, GradeAnswerInput } from "./grade-answer.schema";

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
    if (avatar) {
        return <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />;
    }
    return (
        <div className="w-9 h-9 rounded-full bg-[#1b61c9]/12 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-[#1b61c9]">{name.charAt(0).toUpperCase()}</span>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="px-8 py-8 space-y-6 animate-pulse">
            <div className="h-7 w-56 bg-gray-100 rounded-lg" />
            <div className="flex gap-2">
                <div className="h-9 w-24 bg-gray-100 rounded-xl" />
                <div className="h-9 w-24 bg-gray-100 rounded-xl" />
            </div>
            {[0, 1].map((i) => (
                <div key={i} className="space-y-3">
                    <div className="h-5 w-40 bg-gray-100 rounded" />
                    <div className="h-48 bg-gray-100 rounded-2xl" />
                    <div className="h-48 bg-gray-100 rounded-2xl" />
                </div>
            ))}
        </div>
    );
}

function AnswerCard({
    answer,
    courseId,
}: {
    answer: EssayAnswer;
    courseId: string;
}) {
    const { mutate: gradeAnswer, isPending } = useGradeAnswer(courseId);
    const aiGrade = useAIGrade();

    const isGraded = answer.points_earned !== null;
    const [editing, setEditing] = useState(!isGraded);
    const maxPoints = answer.question.points;

    const schema = useMemo(() => gradeAnswerSchema(maxPoints), [maxPoints]);
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<GradeAnswerInput>({
        resolver: zodResolver(schema),
        defaultValues: {
            points:   answer.points_earned ?? undefined,
            feedback: answer.ai_feedback ?? "",
        },
    });

    const handleAIGrade = () => {
        aiGrade.mutate(
            {
                questionContent: answer.question.content,
                sampleAnswer: answer.question.sample_answer,
                studentAnswer: answer.answer,
                maxPoints,
            },
            {
                onSuccess: (data) => {
                    setValue("points", data.points);
                    setValue("feedback", data.feedback);
                },
            }
        );
    };

    const onSubmit = (values: GradeAnswerInput) => {
        gradeAnswer(
            { answerId: answer.id, points_earned: values.points, feedback: values.feedback },
            { onSuccess: () => setEditing(false) }
        );
    };

    return (
        <div
            className="bg-white rounded-2xl border border-[#e0e2e6] p-5 space-y-4"
            style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 16px" }}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Avatar name={answer.attempt.user.name} avatar={answer.attempt.user.avatar} />
                    <div>
                        <p className="text-sm font-semibold text-[#181d26]">{answer.attempt.user.name}</p>
                        <p className="text-xs text-[rgba(4,14,32,0.45)]">{answer.attempt.user.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {isGraded && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                            {answer.points_earned}/{maxPoints} điểm
                        </span>
                    )}
                    {!isGraded && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
                            Chưa chấm
                        </span>
                    )}
                    <span className="text-xs text-[rgba(4,14,32,0.4)]">
                        {formatDate(answer.attempt.submitted_at)}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider">
                    Câu hỏi:
                </p>
                <p className="text-sm text-[#181d26]">{answer.question.content}</p>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider">
                    Bài làm:
                </p>
                <div className="bg-[#f8fafc] border border-[#e0e2e6] rounded-xl px-4 py-3">
                    <p className="text-sm text-[#181d26] whitespace-pre-wrap">{answer.answer}</p>
                </div>
            </div>

            {answer.question.sample_answer && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider">
                        Gợi ý đáp án:
                    </p>
                    <p className="text-sm text-[rgba(4,14,32,0.6)] italic">{answer.question.sample_answer}</p>
                </div>
            )}

            {isGraded && !editing ? (
                <div className="space-y-3 pt-1">
                    {answer.ai_feedback && (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider">
                                Nhận xét:
                            </p>
                            <p className="text-sm text-[rgba(4,14,32,0.7)]">{answer.ai_feedback}</p>
                        </div>
                    )}
                    <button
                        onClick={() => setEditing(true)}
                        className="text-sm font-medium text-[#1b61c9] hover:underline"
                    >
                        Chấm lại
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1 border-t border-[#f0f2f5]">
                    {/* AI grading button */}
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[rgba(4,14,32,0.55)] uppercase tracking-wider">
                            Chấm điểm:
                        </label>
                        <button
                            type="button"
                            onClick={handleAIGrade}
                            disabled={aiGrade.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1b61c9] bg-[#1b61c9]/8 hover:bg-[#1b61c9]/15 border border-[#1b61c9]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {aiGrade.isPending ? (
                                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                                </svg>
                            ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
                                    <path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z" />
                                </svg>
                            )}
                            {aiGrade.isPending ? "Đang phân tích..." : "Gợi ý AI"}
                        </button>
                    </div>

                    {aiGrade.isError && (
                        <p className="text-xs text-red-500">
                            Không thể kết nối AI. Vui lòng thử lại.
                        </p>
                    )}

                    <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-[rgba(4,14,32,0.55)] shrink-0">
                            Điểm (tối đa {maxPoints}):
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={maxPoints}
                            step={0.5}
                            {...register("points", { valueAsNumber: true })}
                            className="w-24 border border-[#e0e2e6] rounded-lg px-3 py-1.5 text-sm text-[#181d26] focus:outline-none focus:border-[#1b61c9] focus:ring-1 focus:ring-[#1b61c9]/20"
                            placeholder="0"
                        />
                    </div>
                    {errors.points && (
                        <p className="text-xs text-red-500">{errors.points.message}</p>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[rgba(4,14,32,0.55)]">Nhận xét:</label>
                        <textarea
                            rows={3}
                            {...register("feedback")}
                            placeholder="Viết nhận xét cho học viên..."
                            className="w-full border border-[#e0e2e6] rounded-xl px-3 py-2 text-sm text-[#181d26] resize-none focus:outline-none focus:border-[#1b61c9] focus:ring-1 focus:ring-[#1b61c9]/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 bg-[#1b61c9] hover:bg-[#1550aa] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? "Đang lưu..." : "Lưu điểm"}
                        </button>
                        {isGraded && (
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="px-4 py-2 text-sm font-medium text-[rgba(4,14,32,0.6)] hover:bg-[#f8fafc] rounded-xl transition-colors"
                            >
                                Hủy
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}

export default function EssaysPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [gradedFilter, setGradedFilter] = useState<"all" | "ungraded">("all");
    const { data, isLoading } = useEssays(id, gradedFilter);
    const { data: courses = [] } = useTeacherCourses();
    const courseTitle = courses.find((c) => c.id === id)?.title ?? "…";

    if (isLoading) return <Skeleton />;

    const quizzes = data?.quizzes ?? [];
    const totalAnswers = quizzes.reduce((s, q) => s + q.answers.length, 0);

    return (
        <div className="px-8 py-8 space-y-6">
            <div>
                <Breadcrumb items={[
                  { label: "Khóa học",       href: "/teacher/courses" },
                  { label: courseTitle,       href: `/teacher/courses/${id}/edit` },
                  { label: "Chấm bài tự luận" },
                ]} />
                <h1 className="text-2xl font-semibold text-[#181d26]">Chấm bài tự luận</h1>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setGradedFilter("all")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        gradedFilter === "all"
                            ? "bg-[#1b61c9] text-white"
                            : "bg-white border border-[#e0e2e6] text-[rgba(4,14,32,0.65)] hover:bg-[#f8fafc]"
                    }`}
                >
                    Tất cả
                </button>
                <button
                    onClick={() => setGradedFilter("ungraded")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        gradedFilter === "ungraded"
                            ? "bg-[#1b61c9] text-white"
                            : "bg-white border border-[#e0e2e6] text-[rgba(4,14,32,0.65)] hover:bg-[#f8fafc]"
                    }`}
                >
                    Chưa chấm
                </button>
            </div>

            {totalAnswers === 0 ? (
                <div
                    className="bg-white rounded-2xl border border-[#e0e2e6] py-20 flex flex-col items-center gap-3"
                    style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
                >
                    <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] border border-[#e0e2e6] flex items-center justify-center">
                        <FileText size={22} className="text-[rgba(4,14,32,0.3)]" />
                    </div>
                    <p className="text-sm text-[rgba(4,14,32,0.45)]">
                        {gradedFilter === "ungraded"
                            ? "Không có bài tự luận nào chưa được chấm."
                            : "Khóa học này chưa có bài tự luận nào."}
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-[#181d26]">{quiz.title}</h2>
                                <span className="text-xs text-[rgba(4,14,32,0.4)] bg-[#f0f2f5] px-2 py-0.5 rounded-full">
                                    {quiz.answers.length} bài
                                </span>
                            </div>
                            <div className="space-y-4">
                                {quiz.answers.map((answer) => (
                                    <AnswerCard key={answer.id} answer={answer} courseId={id} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
