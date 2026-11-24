"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Download, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { elements } from "@/content/elements";
import { SandboxFrame, extractHtml } from "@/components/sandbox-frame";
import {
  clearStudio,
  copyText,
  downloadText,
  emptyStudio,
  loadStudio,
  saveStudio,
  type StudioData,
} from "@/lib/storage";
import {
  fetchStatus,
  getClassCode,
  requestGenerate,
  requestImprove,
  setClassCode,
  StudioApiError,
} from "@/lib/studio-api";
import { cn } from "@/lib/utils";

const CANVA_AI_URL = "https://www.canva.com/ai";

type Side = "before" | "after";
type Slot =
  | { status: "idle" }
  | { status: "loading"; chars: number }
  | { status: "done"; html: string; prompt: string }
  | { status: "error"; message: string };

function buildTxt(data: StudioData) {
  const day = new Date().toLocaleDateString("ko-KR");
  const a = data.analysis;
  const lines = [
    `Prompt Lab 프롬프트 기록 (${day})`,
    "",
    "■ 내가 처음 쓴 프롬프트",
    data.original.trim() || "(아직 작성하지 않음)",
    "",
  ];
  if (a) {
    lines.push("■ AI가 발전시킨 프롬프트", a.improvedPrompt.trim(), "");
    lines.push("■ 무엇이 달라졌을까?");
    if (a.strengths.length) lines.push("[잘 쓴 부분]", ...a.strengths.map((s) => `- ${s}`));
    if (a.improvements.length) {
      lines.push("[구체화한 부분]");
      for (const i of a.improvements) lines.push(`- ${i.before}`, `  → ${i.after}`, `  이유: ${i.reason}`);
    }
    if (a.assumptions.length) lines.push("[AI가 제안한 기본값]", ...a.assumptions.map((s) => `- ${s}`));
    lines.push("");
  }
  lines.push(
    "■ 내가 검토한 최종 프롬프트",
    data.final.trim() || "(아직 작성하지 않음)",
    "",
    "Canva Code에는 '내가 검토한 최종 프롬프트'를 복사해 붙여 넣으세요.",
    "",
  );
  return lines.join("\n");
}

const textareaClass = "field";

export function StudioWorkbench() {
  const [data, setData] = useState<StudioData>(emptyStudio);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">("idle");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmPull, setConfirmPull] = useState(false);

  const [ai, setAi] = useState<{ aiReady: boolean; codeRequired: boolean } | null>(null);
  const [code, setCode] = useState("");
  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [slots, setSlots] = useState<Record<Side, Slot>>({
    before: { status: "idle" },
    after: { status: "idle" },
  });

  const [compareTab, setCompareTab] = useState<Side>("before");
  const finalRef = useRef<HTMLTextAreaElement>(null);
  const aborter = useRef<AbortController | null>(null);

  // 브라우저에 저장된 내용 불러오기, AI 사용 가능 여부 확인
  useEffect(() => {
    setData(loadStudio());
    setCode(getClassCode());
    setReady(true);
    fetchStatus().then(setAi);
    aborter.current = new AbortController();
    return () => aborter.current?.abort();
  }, []);

  // 입력이 멈추면 자동 저장
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      if (!data.original && !data.final && !data.analysis) {
        clearStudio();
        setSaveState("idle");
        return;
      }
      const ok = saveStudio({ ...data, savedAt: new Date().toISOString() });
      setSaveState(ok ? "saved" : "failed");
    }, 500);
    return () => window.clearTimeout(t);
  }, [data, ready]);

  const analysis = data.analysis;
  const hasOriginal = data.original.trim().length >= 10;
  const aiReady = ai?.aiReady ?? false;
  const needCode = Boolean(ai?.codeRequired) && !code.trim();
  const stale = Boolean(analysis) && analysis!.originalPrompt.trim() !== data.original.trim();
  const bothDone = slots.before.status === "done" && slots.after.status === "done";

  function onAuthError(e: unknown) {
    if (e instanceof StudioApiError && e.status === 401) {
      setCode("");
      setClassCode("");
    }
  }

  async function improve(withAnswers = false) {
    if (improving || !hasOriginal) return;
    setImproving(true);
    setImproveError(null);
    try {
      const qa =
        withAnswers && analysis
          ? analysis.followUpQuestions.map((q) => ({ question: q, answer: answers[q] ?? "" }))
          : [];
      setClassCode(code.trim());
      const result = await requestImprove(data.original.trim(), qa, code.trim(), aborter.current?.signal);
      setData((d) => ({ ...d, analysis: result, final: result.improvedPrompt }));
      setAnswers({});
      setSlots({ before: { status: "idle" }, after: { status: "idle" } });
    } catch (e) {
      onAuthError(e);
      setImproveError(e instanceof Error ? e.message : "다시 시도해 주세요.");
    } finally {
      setImproving(false);
    }
  }

  async function generate(side: Side) {
    const prompt = (side === "before" ? data.original : data.final).trim();
    setSlots((s) => ({ ...s, [side]: { status: "loading", chars: 0 } }));
    try {
      const raw = await requestGenerate(
        prompt,
        code.trim(),
        (chars) => setSlots((s) => (s[side].status === "loading" ? { ...s, [side]: { status: "loading", chars } } : s)),
        aborter.current?.signal,
      );
      const html = extractHtml(raw);
      if (!/<(html|body|div|main|script)[\s>]/i.test(html)) {
        throw new StudioApiError("AI가 앱 대신 다른 내용을 답했습니다. 다시 만들어 주세요.", 0);
      }
      setSlots((s) => ({ ...s, [side]: { status: "done", html, prompt } }));
    } catch (e) {
      onAuthError(e);
      setSlots((s) => ({
        ...s,
        [side]: { status: "error", message: e instanceof Error ? e.message : "다시 만들어 주세요." },
      }));
    }
  }

  function pullOriginal(force = false) {
    if (!force && data.final.trim()) {
      setConfirmPull(true);
      return;
    }
    setConfirmPull(false);
    setData((d) => ({ ...d, final: d.original }));
    finalRef.current?.focus();
  }

  async function copyFinal() {
    const ok = await copyText(data.final);
    if (ok) toast.success("최종 프롬프트를 복사했습니다");
    else toast.error("복사하지 못했습니다. 글을 직접 선택해 Ctrl+C로 복사해 주세요.");
  }

  function download() {
    downloadText("prompt-lab-내-프롬프트.txt", buildTxt(data));
    toast.success("TXT 파일을 내려받았습니다");
  }

  function reset() {
    clearStudio();
    setData(emptyStudio);
    setSlots({ before: { status: "idle" }, after: { status: "idle" } });
    setConfirmReset(false);
    setSaveState("idle");
    toast.success("이 브라우저에 저장된 내용을 지웠습니다");
  }

  const finalTextarea = (
    <>
      <label htmlFor="final" className="sr-only">
        최종 프롬프트
      </label>
      <textarea
        id="final"
        ref={finalRef}
        value={data.final}
        onChange={(e) => setData((d) => ({ ...d, final: e.target.value }))}
        rows={analysis ? 18 : 12}
        maxLength={6000}
        placeholder="1번 내용을 가져와 다듬거나, 여기에 바로 써도 됩니다."
        className={textareaClass}
      />
    </>
  );

  /** 프롬프트 옆에 붙는 "앱 만들기" 버튼과 결과. Before와 After가 같은 함수, 같은 조건을 쓴다. */
  function appSlot(side: Side) {
    if (!aiReady) return null;
    const slot = slots[side];
    const prompt = (side === "before" ? data.original : data.final).trim();
    const can = prompt.length >= 10 && !needCode;
    const changed = slot.status === "done" && slot.prompt !== prompt;
    let hint = "";
    if (slot.status === "idle") hint = "대략 이런 앱이 나온다는 것을 보여 주는 시제품입니다.";
    if (slot.status === "loading") hint = slot.chars === 0 ? "1분쯤 걸립니다." : `${slot.chars.toLocaleString("ko-KR")}자 작성 중`;
    if (changed) hint = "프롬프트가 바뀌었습니다. 다시 만들면 반영됩니다.";

    return (
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => generate(side)}
            disabled={!can || slot.status === "loading"}
            className="btn-quiet btn-sm"
          >
            {slot.status === "loading" ? "만드는 중…" : slot.status === "idle" ? "이 프롬프트로 앱 만들기" : "다시 만들기"}
          </button>
          <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
            {hint}
          </span>
        </div>
        {slot.status === "loading" && <div className="mt-4 h-40 animate-pulse rounded-[20px] bg-card" />}
        {slot.status === "done" && (
          <SandboxFrame
            html={slot.html}
            title={side === "before" ? "내 프롬프트로 만든 앱" : "After 프롬프트로 만든 앱"}
            className="mt-4"
          />
        )}
        {slot.status === "error" && (
          <p role="alert" className="mt-4 rounded-xl border border-destructive/50 px-5 py-4 text-[15px] leading-relaxed">
            {slot.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-16 lg:space-y-24">
      {aiReady && ai?.codeRequired && (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="class-code" className="text-sm font-semibold">
            수업 접속 코드
          </label>
          <input
            id="class-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            placeholder="선생님이 알려 준 코드"
            className="h-11 w-56 rounded-xl border border-input bg-background px-3 text-[15px] focus:border-primary focus:outline-none"
          />
        </div>
      )}
      {/* 1. 내 프롬프트 */}
      <section aria-labelledby="s1" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h2 id="s1" className="text-2xl font-bold tracking-[-0.01em] lg:text-[1.75rem]">
            1. 만들고 싶은 앱을 설명해 주세요
          </h2>
          <p className="mt-2 text-[17px] text-muted-foreground">
            형식 없이 편하게 쓰세요.
          </p>
          {data.source && (
            <p className="mt-3 rounded-lg bg-accent px-4 py-2.5 text-sm">
              가져온 예시: {data.source}. 내 생각으로 바꿔 보세요.
            </p>
          )}
          <label htmlFor="original" className="sr-only">
            내 프롬프트
          </label>
          <textarea
            id="original"
            value={data.original}
            onChange={(e) => setData((d) => ({ ...d, original: e.target.value }))}
            rows={9}
            maxLength={2000}
            placeholder="예: 나는 운동을 좋아하는데 학생들이 꾸준히 운동할 수 있도록 운동 기록 앱을 만들고 싶어. 운동한 시간을 기록하고…"
            className={cn(textareaClass, "mt-4")}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>개인정보는 쓰지 마세요.</span>
            <span aria-live="polite">
              {saveState === "saved" && "자동 저장됨"}
              {saveState === "failed" && "자동 저장 불가. TXT로 내려받으세요."}
              {saveState === "idle" && `${data.original.length} / 2000자`}
            </span>
          </div>
          {appSlot("before")}
        </div>

        <aside aria-label="프롬프트 작성 가이드" className="panel self-start p-5">
          <h3 className="font-bold">빠진 것 확인</h3>
          <ul className="mt-3 space-y-3">
            {elements.map((el) => (
              <li key={el.key} className="flex gap-3">
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: el.color }} aria-hidden="true" />
                <span>
                  <span className="font-semibold">{el.name}</span>
                  <span className="block text-sm text-muted-foreground">{el.question}</span>
                </span>
              </li>
            ))}
          </ul>

        </aside>
      </section>

      {/* 2. AI와 함께 발전시키기 */}
      <section aria-labelledby="s2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[60ch]">
            <h2 id="s2" className="text-2xl font-bold tracking-[-0.01em] lg:text-[1.75rem]">
              2. AI와 함께 발전시키기
            </h2>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              잘 쓴 부분과 더 정하면 좋을 부분을 알려 줍니다.
            </p>
          </div>
          {aiReady && (
            <button
              type="button"
              onClick={() => improve(false)}
              disabled={!hasOriginal || improving || needCode}
              className="btn-primary shrink-0"
            >
              {improving ? "AI가 읽는 중…" : analysis ? "다시 발전시키기" : "AI와 함께 발전시키기"}
            </button>
          )}
        </div>

        {ai && !aiReady && (
          <p className="mt-4 rounded-xl border border-dashed border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
            AI가 연결되어 있지 않습니다. 아래에서 직접 다듬어 주세요.
          </p>
        )}

        {aiReady && !hasOriginal && !analysis && (
          <p className="mt-4 text-sm text-muted-foreground">1번을 10자 이상 쓰면 시작됩니다.</p>
        )}

        {improveError && (
          <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/50 px-5 py-4 text-[15px]">
            <span>{improveError}</span>
            <button type="button" onClick={() => improve(false)} disabled={improving || !hasOriginal} className="font-semibold underline">
              다시 시도
            </button>
            
          </div>
        )}

        {improving && (
          <div className="mt-6 space-y-3" aria-live="polite">
            <p className="text-sm text-muted-foreground">
              AI가 읽는 중입니다. 20~40초 걸립니다.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-[20px] bg-card" />
              ))}
            </div>
          </div>
        )}

        {!improving && analysis && (
          <div className="mt-6 space-y-8">
            {stale && (
              <p className="rounded-xl bg-accent px-5 py-3 text-sm">
                1번을 고쳤습니다. 아래는 고치기 전 글의 분석입니다.
              </p>
            )}
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="font-bold">Before</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">내가 쓴 원문</p>
                <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-[20px] bg-card p-5 font-sans text-[17px] leading-relaxed">
                  {analysis.originalPrompt}
                </pre>
              </div>
              <div>
                <h3 className="font-bold">After</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  AI와 발전시킨 프롬프트. 직접 고칠 수 있습니다.
                </p>
                <div className="mt-3">{finalTextarea}</div>
                {appSlot("after")}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold tracking-[-0.01em]">무엇이 달라졌을까?</h3>
              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="space-y-5">
                  <div className="panel p-5">
                    <h4 className="font-semibold">처음부터 잘 쓴 부분</h4>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
                      {analysis.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  {analysis.assumptions.length > 0 && (
                    <div className="panel p-5">
                      <h4 className="font-semibold">AI가 제안한 기본값</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        정답이 아닙니다. 바꿔도 됩니다.
                      </p>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
                        {analysis.assumptions.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="panel p-5">
                  <h4 className="font-semibold">바뀐 부분과 이유</h4>
                  {analysis.improvements.length === 0 ? (
                    <p className="mt-2 text-[15px] leading-relaxed">
                      바꾼 부분이 거의 없습니다. 처음부터 잘 썼습니다.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-border">
                      {analysis.improvements.map((i) => (
                        <li key={i.before + i.after} className="py-3.5 first:pt-0 last:pb-0">
                          <p className="text-sm text-muted-foreground">{i.before}</p>
                          <p className="mt-1 text-[15px] leading-relaxed">{i.after}</p>
                          <p className="mt-1.5 text-sm leading-relaxed text-sky">{i.reason}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {analysis.followUpQuestions.length > 0 && (
                <div className="mt-5 rounded-[20px] border border-input p-6">
                  <h4 className="font-semibold">더 생각해 볼 질문</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    답하지 않아도 됩니다.
                  </p>
                  <div className="mt-3 space-y-3">
                    {analysis.followUpQuestions.map((q, idx) => (
                      <div key={q}>
                        <label htmlFor={`q${idx}`} className="text-[15px]">
                          {q}
                        </label>
                        <input
                          id={`q${idx}`}
                          value={answers[q] ?? ""}
                          onChange={(e) => setAnswers((a) => ({ ...a, [q]: e.target.value }))}
                          maxLength={300}
                          className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-4 text-[15px] focus:border-primary focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => improve(true)}
                    disabled={improving || stale || !Object.values(answers).some((v) => v.trim())}
                    className="btn-quiet btn-sm mt-4"
                  >
                    답변 반영하기
                  </button>
                </div>
              )}

              <p className="mt-6 max-w-[70ch] text-lg leading-relaxed">{analysis.learningSummary}</p>
            </div>
          </div>
        )}

        {!improving && !analysis && (
          <div className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-bold">최종 프롬프트</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {aiReady ? "직접 다듬어도 됩니다." : "Canva Code에 붙여 넣을 글"}
                </p>
              </div>
              <button type="button" onClick={() => pullOriginal()} disabled={!data.original.trim()} className="btn-quiet btn-sm">
                1번 내용 가져오기
              </button>
            </div>
            {confirmPull && (
              <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-accent px-4 py-3 text-sm">
                <span>쓴 내용이 1번 내용으로 바뀝니다.</span>
                <button type="button" className="font-semibold underline" onClick={() => pullOriginal(true)}>
                  바꾸기
                </button>
                <button type="button" className="text-muted-foreground underline" onClick={() => setConfirmPull(false)}>
                  취소
                </button>
              </div>
            )}
            <div className="mt-4">{finalTextarea}</div>
            {appSlot("after")}
          </div>
        )}
      </section>

      {/* 두 앱을 모두 만들었을 때의 비교 안내 */}
      {bothDone && (
        <section aria-labelledby="cmp">
          <h2 id="cmp" className="text-2xl font-bold tracking-[-0.01em] lg:text-[1.75rem]">
            두 앱 나란히 보기
          </h2>
          {/* 이미 만들어진 HTML을 다시 보여 줄 뿐이다. AI를 다시 부르지 않으므로 비용이 들지 않는다. */}
          <div role="tablist" aria-label="앱 전환" className="seg mt-4 lg:hidden">
            {(["before", "after"] as const).map((side) => (
              <button
                key={side}
                role="tab"
                type="button"
                aria-selected={compareTab === side}
                onClick={() => setCompareTab(side)}
                className="flex-1"
              >
                {side === "before" ? "Before" : "After"}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-5 lg:mt-6 lg:grid-cols-2">
            {(["before", "after"] as const).map((side) => {
              const slot = slots[side];
              if (slot.status !== "done") return null;
              return (
                <div key={side} className={cn("min-w-0", compareTab !== side && "hidden lg:block")}>
                  <SandboxFrame
                    html={slot.html}
                    title={side === "before" ? "Before: 내 프롬프트로 만든 앱" : "After: AI와 발전시킨 프롬프트로 만든 앱"}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-8 border-t border-input pt-8">
          <h3 className="font-bold">직접 눌러 보고 판단하세요</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            화려함보다 작동, 계산, 잘못된 입력 처리, 내 의도와의 일치를 보세요.
          </p>
          <dl className="mt-4 grid gap-x-8 gap-y-4 text-[15px] leading-relaxed md:grid-cols-2">
            <div>
              <dt className="font-semibold">After가 확실히 다르다</dt>
              <dd className="text-muted-foreground">구체적으로 쓴 것이 만든 차이입니다.</dd>
            </div>
            <div>
              <dt className="font-semibold">겉은 비슷한데 기능이 다르다</dt>
              <dd className="text-muted-foreground">프롬프트는 기능에도 영향을 줍니다.</dd>
            </div>
            <div>
              <dt className="font-semibold">둘이 비슷하다</dt>
              <dd className="text-muted-foreground">처음부터 잘 쓴 것입니다.</dd>
            </div>
            <div>
              <dt className="font-semibold">Before가 더 좋다</dt>
              <dd className="text-muted-foreground">AI가 항상 정답은 아닙니다. 고르는 건 사람입니다.</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            AI의 결과는 만들 때마다 달라집니다. 한 번으로 단정하지 마세요.
          </p>
          </div>
        </section>
      )}

      {/* 4. 저장 */}
      <section aria-labelledby="s4">
        <h2 id="s4" className="text-2xl font-bold tracking-[-0.01em] lg:text-[1.75rem]">
          3. 저장하기
        </h2>
        <p className="mt-1 max-w-[64ch] leading-relaxed text-muted-foreground">
          {analysis
            ? "2번의 After 칸이 최종 프롬프트입니다."
            : "최종 프롬프트를 복사하거나 내려받으세요."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={copyFinal} disabled={!data.final.trim()} className="btn-primary">
            <Copy className="size-4" aria-hidden="true" />
            최종 프롬프트 복사
          </button>
          <button type="button" onClick={download} disabled={!data.original.trim() && !data.final.trim()} className="btn-quiet">
            <Download className="size-4" aria-hidden="true" />
            TXT로 내려받기
          </button>
          <a href={CANVA_AI_URL} target="_blank" rel="noopener noreferrer" className="btn-quiet">
            Canva AI 열기
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
        <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
          이 컴퓨터에만 저장됩니다. TXT로도 내려받아 두세요.
        </p>
      </section>

      {/* 저장 내용 지우기 */}
      <section aria-labelledby="s5" className="border-t border-border pt-6">
        <h2 id="s5" className="font-bold">
          공용 컴퓨터라면
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          수업 후 저장된 내용을 지워 주세요.
        </p>
        {confirmReset ? (
          <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span>모두 지워집니다. TXT로 내려받았나요?</span>
            <button type="button" onClick={reset} className="font-semibold text-destructive underline">
              모두 지우기
            </button>
            <button type="button" onClick={() => setConfirmReset(false)} className="text-muted-foreground underline">
              취소
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={!data.original && !data.final && !analysis}
            className="btn-quiet btn-sm mt-3"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            저장된 내용 지우기
          </button>
        )}
      </section>
    </div>
  );
}
