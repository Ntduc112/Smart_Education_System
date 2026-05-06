import { z } from "zod";

export const gradeAnswerSchema = (maxPoints: number) =>
  z.object({
    points: z
      .number({ invalid_type_error: "Điểm phải là số" })
      .min(0, "Điểm không được âm")
      .max(maxPoints, `Điểm tối đa là ${maxPoints}`),
    feedback: z.string(),
  });

export type GradeAnswerInput = z.infer<ReturnType<typeof gradeAnswerSchema>>;
