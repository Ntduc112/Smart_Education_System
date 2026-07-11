"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { oneDark } from "@codemirror/theme-one-dark";
import api from "@/lib/axios";

// ── Types ──────────────────────────────────────────────────────────────────

interface TestCase {
  id: string;
  input: string;
  expected: string;
  order: number;
}

interface CodingQuestionProps {
  questionType: "CODING" | "DEBUGGING";
  questionId: string;
  content: string;
  language: string;
  starterCode: string | null;
  testCases: TestCase[];
  points: number;
  order: number;
  submitted: boolean;
  answer: string;
  onChange: (code: string) => void;
  attemptResult?: {
    is_correct: boolean | null;
    code_output: string | null;
    ai_feedback: string | null;
    points_earned: number | null;
  };
}

// ── Language support ───────────────────────────────────────────────────────

const LANG_EXTENSIONS: Record<string, () => ReturnType<typeof python>> = {
  python: python,
  javascript: javascript,
  c: () => cpp(),
  cpp: cpp,
  java: java,
};

const LANG_LABELS: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  c: "C",
  cpp: "C++",
  java: "Java",
};

const editorSizingTheme = EditorView.theme({
  "&": {
    minHeight: "200px",
    backgroundColor: "#282c34",
  },
  ".cm-scroller": {
    minHeight: "200px",
    overflow: "auto",
  },
});

// ── CodeMirror Editor ──────────────────────────────────────────────────────

function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
}: {
  value: string;
  onChange: (val: string) => void;
  language: string;
  readOnly?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const langExt = LANG_EXTENSIONS[language];
    const extensions = [
      basicSetup,
      oneDark,
      editorSizingTheme,
      EditorView.lineWrapping,
      ...(langExt ? [langExt()] : []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
    ];

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    const state = EditorState.create({ doc: value, extensions });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, readOnly]);

  // CodeMirror giữ document riêng; đồng bộ khi parent đổi attempt hoặc reset retry.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="min-h-[200px] overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#282c34]"
    />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function CodingQuestion({
  questionType,
  questionId,
  content,
  language,
  starterCode,
  testCases,
  points,
  order,
  submitted,
  answer,
  onChange,
  attemptResult,
}: CodingQuestionProps) {
  const code = answer || starterCode || "";
  const isDebugging = questionType === "DEBUGGING";
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState<
    { input: string; expected: string; actual: string; passed: boolean; stderr: string }[]
  >([]);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [activeTab, setActiveTab] = useState<"testcases" | "console">("testcases");

  const handleCodeChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  // Starter code hiển thị trong editor cũng phải là answer thật khi nộp bài.
  useEffect(() => {
    if (!submitted && !answer && starterCode) onChange(starterCode);
    // onChange được tạo inline ở parent; phụ thuộc vào nó sẽ kích hoạt effect mỗi render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, starterCode, submitted]);

  const handleRunTests = async () => {
    setRunning(true);
    setActiveTab("testcases");
    try {
      const res = await api.post("/student/code/run", {
        code,
        language,
        inputs: testCases.map((tc) => tc.input),
      });
      const executions = res.data.results as {
        stdout?: string;
        stderr?: string;
        exitCode?: number;
        timedOut?: boolean;
      }[];
      const results: typeof runResults = testCases.map((tc, index) => {
        const execution = executions[index] ?? {};
        const actual = (execution.stdout ?? "").trim();
        return {
          input: tc.input,
          expected: tc.expected.trim(),
          actual,
          passed: execution.exitCode === 0 && !execution.timedOut && actual === tc.expected.trim(),
          stderr: execution.stderr || "",
        };
      });
      setRunResults(results);
    } catch (err) {
      setConsoleOutput(`Error: ${err instanceof Error ? err.message : "Chạy code thất bại"}`);
      setActiveTab("console");
    }
    setRunning(false);
  };

  const handleRunCustom = async () => {
    setRunning(true);
    setActiveTab("console");
    try {
      const res = await api.post("/student/code/run", { code, language, input: "" });
      setConsoleOutput(
        (res.data.stdout || "") + (res.data.stderr ? `\n[stderr] ${res.data.stderr}` : "")
      );
    } catch {
      setConsoleOutput("Lỗi kết nối server");
    }
    setRunning(false);
  };

  const passCount = runResults.filter((r) => r.passed).length;

  return (
    <div id={`coding-question-${questionId}`} className="rounded-xl border border-[#DCE6F4] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-5 pb-3 border-b border-[#f0f2f5]">
        <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center mt-0.5 ${
          isDebugging ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
        }`}>
          {order}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
              isDebugging ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              {questionType === "DEBUGGING" ? "Sửa lỗi code" : "Lập trình"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-[#1e1e1e] text-[#e0e0e0]">
              {LANG_LABELS[language] || language}
            </span>
            <span className="text-xs text-[rgba(4,14,32,0.45)]">{points} điểm</span>
          </div>
          <p className="text-sm font-medium text-[#181d26] leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>

      {/* Result badge when submitted */}
      {submitted && attemptResult && (
        <div
          className={`mx-5 mt-3 px-4 py-2.5 rounded-lg flex items-center gap-2 ${
            attemptResult.is_correct
              ? "bg-green-50 border border-green-200"
              : attemptResult.is_correct === false
              ? "bg-red-50 border border-red-200"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <span className="text-sm font-medium">
            {attemptResult.is_correct
              ? "✅ Đạt"
              : attemptResult.is_correct === false
              ? "❌ Chưa đạt"
              : "⏳ Đang chờ"}
          </span>
          {attemptResult.points_earned != null && (
            <span className="text-xs text-[rgba(4,14,32,0.55)]">
              — {attemptResult.points_earned}/{points} điểm
            </span>
          )}
          {attemptResult.ai_feedback && (
            <span className="text-xs text-[rgba(4,14,32,0.55)] ml-2">
              ({attemptResult.ai_feedback})
            </span>
          )}
        </div>
      )}

      {/* Code editor */}
      <div className="p-4">
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          language={language}
          readOnly={submitted}
        />
      </div>

      {/* Action buttons */}
      {!submitted && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            onClick={handleRunTests}
            disabled={running || !code.trim() || testCases.length === 0}
            title={testCases.length === 0 ? "Câu hỏi này không có test case công khai" : undefined}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {running ? (
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            )}
            {questionType === "DEBUGGING" ? "Kiểm tra bản sửa" : "Chạy test cases"}
          </button>
          <button
            onClick={handleRunCustom}
            disabled={running || !code.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-[#DCE6F4] text-[rgba(4,14,32,0.65)] hover:border-emerald-300 hover:text-emerald-600 transition-colors disabled:opacity-50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            Chạy thử
          </button>
        </div>
      )}

      {/* Results panel */}
      {(runResults.length > 0 || consoleOutput || (submitted && attemptResult?.code_output)) && (
        <div className="border-t border-[#f0f2f5]">
          {/* Tabs */}
          <div className="flex border-b border-[#f0f2f5]">
            <button
              onClick={() => setActiveTab("testcases")}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === "testcases"
                  ? "text-emerald-600 border-b-2 border-emerald-500"
                  : "text-[rgba(4,14,32,0.45)] hover:text-[rgba(4,14,32,0.65)]"
              }`}
            >
              Test Cases
              {runResults.length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                  passCount === runResults.length ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {passCount}/{runResults.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("console")}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === "console"
                  ? "text-emerald-600 border-b-2 border-emerald-500"
                  : "text-[rgba(4,14,32,0.45)] hover:text-[rgba(4,14,32,0.65)]"
              }`}
            >
              Console
            </button>
          </div>

          <div className="p-4 max-h-60 overflow-y-auto">
            {activeTab === "testcases" && (
              <div className="space-y-2">
                {/* Show run results */}
                {runResults.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border px-3 py-2.5 ${
                      r.passed ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{r.passed ? "✅" : "❌"} Test {i + 1}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[rgba(4,14,32,0.4)] block text-[10px] mb-0.5">Input</span>
                        <span className="text-[#181d26]">{r.input || "(trống)"}</span>
                      </div>
                      <div>
                        <span className="text-[rgba(4,14,32,0.4)] block text-[10px] mb-0.5">Expected</span>
                        <span className="text-[#181d26]">{r.expected}</span>
                      </div>
                      <div>
                        <span className="text-[rgba(4,14,32,0.4)] block text-[10px] mb-0.5">Output</span>
                        <span className={r.passed ? "text-green-700" : "text-red-600"}>{r.actual || "(trống)"}</span>
                      </div>
                    </div>
                    {r.stderr && (
                      <p className="mt-1 text-[10px] text-red-500 font-mono">{r.stderr}</p>
                    )}
                  </div>
                ))}
                {/* Show attempt output when submitted */}
                {submitted && attemptResult?.code_output && runResults.length === 0 && (
                  <pre className="text-xs font-mono text-[rgba(4,14,32,0.65)] whitespace-pre-wrap">
                    {attemptResult.code_output}
                  </pre>
                )}
              </div>
            )}
            {activeTab === "console" && (
              <pre className="text-xs font-mono text-[rgba(4,14,32,0.7)] whitespace-pre-wrap min-h-[60px]">
                {consoleOutput || "Chưa có output. Nhấn 'Chạy thử' để chạy code."}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
