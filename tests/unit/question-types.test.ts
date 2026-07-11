import { describe, expect, it } from "vitest";
import {
  isCodeBasedQuestionType,
  isExecutableQuestionType,
  normalizeProgramOutput,
} from "@/lib/question-types";

describe("question types", () => {
  it("chỉ chạy code học sinh cho CODING và DEBUGGING", () => {
    expect(isExecutableQuestionType("CODING")).toBe(true);
    expect(isExecutableQuestionType("DEBUGGING")).toBe(true);
    expect(isExecutableQuestionType("CODE_OUTPUT")).toBe(false);
    expect(isCodeBasedQuestionType("CODE_OUTPUT")).toBe(true);
  });

  it("chuẩn hóa output nhiều dòng trước khi chấm", () => {
    expect(normalizeProgramOutput(" 6  \r\nhello   \r\n\r\n")).toBe("6\nhello");
    expect(normalizeProgramOutput("6\nhello")).toBe("6\nhello");
  });
});
