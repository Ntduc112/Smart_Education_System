export const EXECUTABLE_QUESTION_TYPES = ["CODING", "DEBUGGING"] as const;
export const CODE_BASED_QUESTION_TYPES = ["CODING", "DEBUGGING", "CODE_OUTPUT"] as const;

export type ExecutableQuestionType = (typeof EXECUTABLE_QUESTION_TYPES)[number];
export type CodeBasedQuestionType = (typeof CODE_BASED_QUESTION_TYPES)[number];

const EXECUTABLE_TYPE_SET = new Set<string>(EXECUTABLE_QUESTION_TYPES);
const CODE_BASED_TYPE_SET = new Set<string>(CODE_BASED_QUESTION_TYPES);

export function isExecutableQuestionType(type: string): type is ExecutableQuestionType {
  return EXECUTABLE_TYPE_SET.has(type);
}

export function isCodeBasedQuestionType(type: string): type is CodeBasedQuestionType {
  return CODE_BASED_TYPE_SET.has(type);
}

// So sánh output theo cách các online judge thường dùng: thống nhất xuống dòng,
// bỏ khoảng trắng cuối dòng và dòng trống thừa ở đầu/cuối.
export function normalizeProgramOutput(output: string): string {
  return output
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}
