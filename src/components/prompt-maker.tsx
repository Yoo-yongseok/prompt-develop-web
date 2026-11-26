"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Clapperboard,
  Coffee,
  Copy,
  Download,
  Dumbbell,
  ExternalLink,
  Gamepad2,
  GraduationCap,
  Leaf,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Shirt,
  Sofa,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { careers, noCareerYet } from "@/content/careers";
import type { Feature } from "@/lib/llm/protocol";
import {
  clearMaker,
  copyText,
  downloadText,
  emptyMaker,
  isEmpty,
  loadMaker,
  saveMaker,
  type MakerData,
} from "@/lib/storage";
import {
  fetchStatus,
  getClassCode,
  requestFinalize,
  requestFlow,
  requestSuggest,
  setClassCode,
  StudioApiError,
} from "@/lib/studio-api";
import { cn } from "@/lib/utils";

const CANVA_AI_URL = "https://www.canva.com/ai";

const icons: Record<string, LucideIcon> = {
  Dumbbell,
  Gamepad2,
  PawPrint,
  Coffee,
  PiggyBank,
  Shirt,
  Music,
  GraduationCap,
  Sofa,
  Leaf,
  Plane,
  Clapperboard,
};

/** 앱 소개와 고른 기능을 하나의 프롬프트로 합친다. AI를 다시 부르지 않는다. */
function compose(intro: string, chosen: Feature[]) {
  const lines = [intro.trim()];
  if (chosen.length) {
    lines.push("", "[기능]");
    for (const f of chosen) lines.push(`- ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
  }
  return lines.join("\n").trim();
}

function askTemplate(who: string, problem: string) {
  return `이 앱을 쓸 사람: ${who.trim()}\n해결하고 싶은 문제: ${problem.trim()}\n\n이 문제를 해결하려면 어떤 기능이 있으면 좋을지 제안해 줘.`;
}

function buildTxt(d: MakerData) {
  const field = careers.find((c) => c.id === d.fieldId)?.field;
  const day = new Date().toLocaleDateString("ko-KR");
  const lines = [`Prompt Lab 기록 (${day})`, ""];
  lines.push("■ 1단계: 내가 찾은 문제");
  if (field) lines.push(`분야: ${field}`);
  lines.push(`누가 쓰는 앱: ${d.who.trim() || "(쓰지 않음)"}`, `해결할 문제: ${d.problem.trim() || "(쓰지 않음)"}`, "");
  lines.push("■ 2단계: 내가 정한 기능");
  if (d.chosen.length) for (const f of d.chosen) lines.push(`- ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
  else lines.push("(고르지 않음)");
  lines.push("", "■ 3단계: 내가 적은 앱 이용 순서", d.flow.trim() || "(쓰지 않음)", "");
  lines.push("■ 최종 프롬프트 (Canva Code에 붙여 넣기)", d.finalPrompt.trim() || d.prompt.trim() || "(아직 없음)", "");
  return lines.join("\n");
}

function StepHead({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-4 lg:gap-5">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-xl font-bold text-primary-foreground lg:size-12"
        aria-hidden="true"
      >
        {n}
      </span>
      <div>
        <h2 id={`step${n}`} className="text-2xl font-bold tracking-[-0.015em] lg:text-[2rem] lg:leading-tight">
          <span className="sr-only">{n}단계. </span>
          {title}
        </h2>
        <p className="mt-1.5 text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

export function PromptMaker() {
  const [data, setData] = useState<MakerData>(emptyMaker);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">("idle");

  const [ai, setAi] = useState<{ aiReady: boolean; codeRequired: boolean } | null>(null);
  const [code, setCode] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalError, setFinalError] = useState<string | null>(null);

  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [confirmDraft, setConfirmDraft] = useState(false);

  const [custom, setCustom] = useState("");
  const [confirmFill, setConfirmFill] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const aborter = useRef<AbortController | null>(null);
  const finalRef = useRef<HTMLTextAreaElement>(null);

  // 브라우저에 저장된 내용 불러오기, AI 사용 가능 여부 확인
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(loadMaker());
    setCode(getClassCode());
    setReady(true);
    fetchStatus().then(setAi);
    aborter.current = new AbortController();
    return () => aborter.current?.abort();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      if (isEmpty(data)) {
        clearMaker();
        setSaveState("idle");
        return;
      }
      setSaveState(saveMaker(data) ? "saved" : "failed");
    }, 500);
    return () => window.clearTimeout(t);
  }, [data, ready]);

  const patch = (p: Partial<MakerData>) => setData((d) => ({ ...d, ...p }));

  const aiReady = ai?.aiReady ?? false;
  const needCode = Boolean(ai?.codeRequired) && !code.trim();
  const career = careers.find((c) => c.id === data.fieldId);
  const step1Done = data.who.trim().length >= 2 && data.problem.trim().length >= 5;
  const canSuggest = data.ask.trim().length >= 10;
  const canFinalize = data.prompt.trim().length >= 10 && data.flow.trim().length >= 10;
  const finalText = data.finalPrompt.trim();

  function onAuthError(e: unknown) {
    if (e instanceof StudioApiError && e.status === 401) {
      setCode("");
      setClassCode("");
    }
  }

  function fillAsk(force = false) {
    if (!force && data.ask.trim()) {
      setConfirmFill(true);
      return;
    }
    setConfirmFill(false);
    patch({ ask: askTemplate(data.who, data.problem) });
  }

  async function suggest() {
    if (suggesting || !canSuggest) return;
    setSuggesting(true);
    setSuggestError(null);
    try {
      setClassCode(code.trim());
      const s = await requestSuggest(data.ask.trim(), code.trim(), aborter.current?.signal);
      setData((d) => ({ ...d, suggestion: s, chosen: [], prompt: compose(s.intro, []) }));
    } catch (e) {
      onAuthError(e);
      setSuggestError(e instanceof Error ? e.message : "다시 시도해 주세요.");
    } finally {
      setSuggesting(false);
    }
  }

  function toggle(f: Feature) {
    setData((d) => {
      const on = d.chosen.some((c) => c.name === f.name);
      const chosen = on ? d.chosen.filter((c) => c.name !== f.name) : [...d.chosen, f];
      return { ...d, chosen, prompt: compose(d.suggestion?.intro ?? d.ask, chosen) };
    });
  }

  function addCustom() {
    const name = custom.trim();
    if (!name) return;
    setCustom("");
    if (data.chosen.some((c) => c.name === name)) return;
    toggle({ name, detail: "", reason: "" });
  }

  /** 순서를 쓰기 어려운 학생을 위해 AI가 초안을 써 준다. 학생이 고쳐 쓰는 것이 전제다. */
  async function draftFlow(force = false) {
    if (drafting || data.prompt.trim().length < 10) return;
    if (!force && data.flow.trim()) {
      setConfirmDraft(true);
      return;
    }
    setConfirmDraft(false);
    setDrafting(true);
    setDraftError(null);
    try {
      setClassCode(code.trim());
      const { steps } = await requestFlow(data.prompt.trim(), code.trim(), aborter.current?.signal);
      patch({ flow: steps.map((s, i) => `${i + 1}. ${s}`).join("\n") });
    } catch (e) {
      onAuthError(e);
      setDraftError(e instanceof Error ? e.message : "다시 시도해 주세요.");
    } finally {
      setDrafting(false);
    }
  }

  async function finalize() {
    if (finalizing || !canFinalize) return;
    setFinalizing(true);
    setFinalError(null);
    try {
      setClassCode(code.trim());
      const r = await requestFinalize(data.prompt.trim(), data.flow.trim(), code.trim(), aborter.current?.signal);
      setData((d) => ({ ...d, result: r, finalPrompt: r.finalPrompt }));
      window.setTimeout(() => finalRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    } catch (e) {
      onAuthError(e);
      setFinalError(e instanceof Error ? e.message : "다시 시도해 주세요.");
    } finally {
      setFinalizing(false);
    }
  }

  /** AI 없이도 끝낼 수 있도록 두 글을 그대로 합친다. */
  function mergeByHand() {
    patch({
      result: null,
      finalPrompt: `${data.prompt.trim()}\n\n[화면과 이용 순서]\n${data.flow.trim()}`,
    });
  }

  async function copyFinal() {
    const ok = await copyText(data.finalPrompt);
    if (ok) toast.success("최종 프롬프트를 복사했습니다");
    else toast.error("복사하지 못했습니다. 글을 직접 선택해 Ctrl+C로 복사해 주세요.");
  }

  function download() {
    downloadText("prompt-lab-내-프롬프트.txt", buildTxt(data));
    toast.success("TXT 파일을 내려받았습니다");
  }

  function reset() {
    clearMaker();
    setData(emptyMaker);
    setConfirmReset(false);
    setSaveState("idle");
    toast.success("이 브라우저에 저장된 내용을 지웠습니다");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const customChosen = data.chosen.filter((c) => !data.suggestion?.features.some((f) => f.name === c.name));

  return (
    <div className="space-y-20 lg:space-y-28">
      {aiReady && ai?.codeRequired && (
        <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-card p-5">
          <label htmlFor="class-code" className="font-semibold">
            수업 접속 코드
          </label>
          <input
            id="class-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            placeholder="선생님이 알려 준 코드"
            className="h-12 w-64 rounded-xl border border-input bg-background px-4 focus:border-ring focus:outline-none"
          />
        </div>
      )}

      {/* 1단계: 문제 찾기 */}
      <section aria-labelledby="step1">
        <StepHead n={1} title="문제 찾기" sub="관심 있는 분야를 고르고, 앱으로 해결할 문제를 정합니다." />

        <div role="group" aria-label="진로 분야" className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {careers.map((c) => {
            const Icon = icons[c.icon];
            const on = c.id === data.fieldId;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => patch({ fieldId: on ? "" : c.id })}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-left font-semibold transition-colors duration-150",
                  on ? "border-transparent bg-primary" : "border-input hover:bg-card",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {c.field}
              </button>
            );
          })}
        </div>

        {career ? (
          <div className="mt-8">
            <h3 className="text-xl font-bold">이런 문제는 어때요?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              고른 뒤 내 경험에 맞게 바꿔 쓰세요. 관련 직업: {career.jobs.join(", ")}
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {career.situations.map((s) => {
                const on = data.who === s.who && data.problem === s.problem;
                return (
                  <button
                    key={s.problem}
                    type="button"
                    aria-pressed={on}
                    onClick={() => patch({ who: s.who, problem: s.problem })}
                    className={cn(
                      "rounded-[20px] border p-5 text-left transition-colors duration-150",
                      on ? "border-foreground bg-accent" : "border-input hover:bg-card",
                    )}
                  >
                    <span className="block text-sm font-semibold text-sky">{s.who}</span>
                    <span className="mt-1.5 block leading-[1.6]">{s.problem}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-muted-foreground">
            되고 싶은 직업이 아직 없다면 이것부터 떠올려 보세요: {noCareerYet.join(", ")}.
          </p>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div>
            <label htmlFor="who" className="font-bold">
              누가 쓰는 앱인가요?
            </label>
            <input
              id="who"
              value={data.who}
              onChange={(e) => patch({ who: e.target.value })}
              maxLength={80}
              placeholder="예: 운동을 막 시작한 학생"
              className="mt-2 h-14 w-full rounded-xl border border-input bg-background px-4 focus:border-ring focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="problem" className="font-bold">
              어떤 문제를 해결하나요?
            </label>
            <textarea
              id="problem"
              value={data.problem}
              onChange={(e) => patch({ problem: e.target.value })}
              rows={2}
              maxLength={300}
              placeholder="예: 운동을 시작해도 얼마나 했는지 눈에 보이지 않아 금방 그만두게 된다."
              className="field mt-2 rounded-xl px-4 py-3.5"
            />
          </div>
        </div>
        <p className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
          <span>이름, 연락처 같은 개인정보는 쓰지 마세요.</span>
          <span aria-live="polite">
            {saveState === "saved" && "자동 저장됨"}
            {saveState === "failed" && "자동 저장 불가. 끝나면 TXT로 내려받으세요."}
          </span>
        </p>
      </section>

      {/* 2단계: 기능 정하기 */}
      <section aria-labelledby="step2">
        <StepHead n={2} title="기능 정하기" sub="AI에게 문제를 설명하고, 제안받은 기능 중에서 쓸 것을 고릅니다." />

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <label htmlFor="ask" className="font-bold">
            AI에게 보낼 글
          </label>
          <button type="button" onClick={() => fillAsk()} disabled={!step1Done} className="btn-quiet btn-sm">
            1단계 내용 가져오기
          </button>
        </div>
        {confirmFill && (
          <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-accent px-4 py-3 text-sm">
            <span>지금 쓴 글이 1단계 내용으로 바뀝니다.</span>
            <button type="button" className="font-bold underline" onClick={() => fillAsk(true)}>
              바꾸기
            </button>
            <button type="button" className="underline" onClick={() => setConfirmFill(false)}>
              취소
            </button>
          </div>
        )}
        <textarea
          id="ask"
          value={data.ask}
          onChange={(e) => patch({ ask: e.target.value })}
          rows={6}
          maxLength={1500}
          placeholder="누가 쓰는 앱인지, 어떤 문제를 해결하고 싶은지 써 주세요."
          className="field mt-3"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          지금은 어떻게 하고 있는지, 왜 불편한지를 한두 문장 더 쓰면 더 잘 맞는 기능을 제안받습니다.
        </p>

        {ai && !aiReady ? (
          <p className="mt-5 rounded-xl bg-card px-5 py-4 text-sm leading-relaxed">
            AI가 연결되어 있지 않습니다. 아래 칸에 넣고 싶은 기능을 직접 써 주세요.
          </p>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button type="button" onClick={suggest} disabled={!canSuggest || suggesting || needCode} className="btn-primary">
              {suggesting ? "AI가 읽는 중…" : data.suggestion ? "다시 제안받기" : "기능 제안받기"}
            </button>
            {suggesting && <span className="text-sm text-muted-foreground">10~20초 걸립니다.</span>}
          </div>
        )}

        {suggestError && (
          <p role="alert" className="mt-4 rounded-xl border border-destructive/60 px-5 py-4 leading-relaxed">
            {suggestError}
          </p>
        )}

        {suggesting && (
          <div className="mt-6 space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-[20px] bg-card" />
            ))}
          </div>
        )}

        {!suggesting && data.suggestion && (
          <div className="mt-8">
            <p className="rounded-[20px] bg-accent px-6 py-5 text-lg leading-[1.6]">{data.suggestion.praise}</p>

            <h3 className="mt-8 text-xl font-bold">쓸 기능을 골라 보세요</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              전부 고르지 않아도 됩니다. 두세 개에 집중하면 만들기 쉽습니다. 지금 {data.chosen.length}개 골랐습니다.
            </p>
            <ul className="mt-4 space-y-3">
              {data.suggestion.features.map((f) => {
                const on = data.chosen.some((c) => c.name === f.name);
                return (
                  <li key={f.name}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggle(f)}
                      className={cn(
                        "flex w-full items-start gap-4 rounded-[20px] border p-5 text-left transition-colors duration-150",
                        on ? "border-foreground bg-accent" : "border-input hover:bg-card",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border-2",
                          on ? "border-foreground bg-primary" : "border-input bg-background",
                        )}
                        aria-hidden="true"
                      >
                        {on && <Check className="size-5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-lg font-bold">{f.name}</span>
                        <span className="mt-1 block leading-[1.6]">{f.detail}</span>
                        <span className="mt-1.5 block text-sm leading-[1.6] text-muted-foreground">{f.reason}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {customChosen.map((f) => (
                <li key={f.name} className="flex items-center justify-between gap-4 rounded-[20px] border border-foreground bg-accent p-5">
                  <span className="text-lg font-bold">{f.name}</span>
                  <button type="button" onClick={() => toggle(f)} className="shrink-0 text-sm font-semibold underline">
                    빼기
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="custom" className="sr-only">
                내가 생각한 기능
              </label>
              <input
                id="custom"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                maxLength={80}
                placeholder="내가 생각한 기능이 있다면 여기에"
                className="h-12 flex-1 rounded-xl border border-input bg-background px-4 focus:border-ring focus:outline-none"
              />
              <button type="button" onClick={addCustom} disabled={!custom.trim()} className="btn-quiet btn-sm">
                기능 추가
              </button>
            </div>
          </div>
        )}

        {!suggesting && (data.suggestion || (ai && !aiReady)) && (
          <div className="mt-8">
            <label htmlFor="prompt" className="text-xl font-bold">
              내가 정한 프롬프트
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.suggestion
                ? "기능을 고르면 여기에 반영됩니다. 직접 고쳐도 되지만, 기능을 다시 고르면 새로 쓰입니다."
                : "누구를 위한 어떤 앱인지와 넣을 기능을 써 주세요."}
            </p>
            <textarea
              id="prompt"
              value={data.prompt}
              onChange={(e) => patch({ prompt: e.target.value })}
              rows={8}
              maxLength={4000}
              className="field mt-3"
            />
          </div>
        )}
      </section>

      {/* 3단계: 화면 순서 정하기 */}
      <section aria-labelledby="step3">
        <StepHead n={3} title="화면 순서 정하기" sub="사용자가 앱을 열어서 무엇을 차례로 하는지 적으면, 최종 프롬프트로 정리해 줍니다." />

        {data.prompt.trim() ? (
          <details className="mt-8 rounded-[20px] bg-card px-6 py-4">
            <summary className="cursor-pointer font-semibold">
              2단계에서 정한 내용은 자동으로 함께 들어갑니다. 다시 쓰지 않아도 됩니다.
            </summary>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-[1.65] text-muted-foreground">{data.prompt.trim()}</pre>
          </details>
        ) : (
          <p className="mt-8 rounded-[20px] bg-card px-6 py-4 font-semibold">
            먼저 2단계를 마쳐 주세요. 2단계에서 정한 내용이 여기에 자동으로 이어집니다.
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <label htmlFor="flow" className="font-bold">
            앱을 쓰는 순서
          </label>
          {aiReady && (
            <button
              type="button"
              onClick={() => draftFlow()}
              disabled={drafting || finalizing || needCode || data.prompt.trim().length < 10}
              className="btn-quiet btn-sm"
            >
              {drafting ? "AI가 쓰는 중…" : "AI가 제안한 순서 받기"}
            </button>
          )}
        </div>
        {confirmDraft && (
          <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-accent px-4 py-3 text-sm">
            <span>지금 쓴 순서가 AI의 제안으로 바뀝니다.</span>
            <button type="button" className="font-bold underline" onClick={() => draftFlow(true)}>
              바꾸기
            </button>
            <button type="button" className="underline" onClick={() => setConfirmDraft(false)}>
              취소
            </button>
          </div>
        )}
        {draftError && (
          <p role="alert" className="mt-3 rounded-xl border border-destructive/60 px-5 py-4 leading-relaxed">
            {draftError}
          </p>
        )}
        <textarea
          id="flow"
          disabled={drafting}
          value={data.flow}
          onChange={(e) => patch({ flow: e.target.value })}
          rows={6}
          maxLength={1500}
          placeholder={"1. 앱을 열면 오늘 기록이 보인다\n2. 기록하기를 누르면 운동 종류와 시간을 입력하는 화면이 나온다\n3. 저장하면 처음 화면으로 돌아오고 목록에 추가된다"}
          className="field mt-3"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          처음 보는 화면, 누르는 것, 그다음 나오는 화면 순서로 쓰세요. 어렵다면 AI의 제안을 받아 내 생각대로 고쳐도 됩니다.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          {aiReady ? (
            <button type="button" onClick={finalize} disabled={!canFinalize || finalizing || needCode} className="btn-primary">
              {finalizing ? "AI가 정리하는 중…" : data.result ? "다시 정리하기" : "최종 프롬프트 만들기"}
            </button>
          ) : (
            <button type="button" onClick={mergeByHand} disabled={!canFinalize} className="btn-primary">
              합쳐서 최종 프롬프트 만들기
            </button>
          )}
          {finalizing && <span className="text-sm text-muted-foreground">15~30초 걸립니다.</span>}
          {!finalizing && !canFinalize && (
            <span className="text-sm text-muted-foreground">
              {data.prompt.trim().length < 10 ? "2단계를 먼저 마쳐 주세요." : "앱을 쓰는 순서를 10자 이상 써 주세요."}
            </span>
          )}
        </div>

        {finalError && (
          <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/60 px-5 py-4 leading-relaxed">
            <span>{finalError}</span>
            <button type="button" onClick={mergeByHand} disabled={!canFinalize} className="text-sm font-bold underline">
              AI 없이 합치기
            </button>
          </div>
        )}

        {finalizing && <div className="mt-6 h-72 animate-pulse rounded-[20px] bg-card" aria-hidden="true" />}

        {!finalizing && finalText && (
          <div className="mt-10">
            <label htmlFor="final" className="text-2xl font-bold tracking-[-0.015em]">
              최종 프롬프트
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              다음 시간에 Canva Code에 붙여 넣을 글입니다. 마음에 들지 않는 부분은 직접 고치세요.
            </p>
            <textarea
              id="final"
              ref={finalRef}
              value={data.finalPrompt}
              onChange={(e) => patch({ finalPrompt: e.target.value })}
              rows={18}
              maxLength={6000}
              className="field mt-3"
            />

            {data.result && (data.result.changes.length > 0 || data.result.assumptions.length > 0) && (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {data.result.changes.length > 0 && (
                  <div className="rounded-[20px] bg-card p-6">
                    <h3 className="font-bold">AI가 정리한 것</h3>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-[1.65]">
                      {data.result.changes.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.result.assumptions.length > 0 && (
                  <div className="rounded-[20px] bg-card p-6">
                    <h3 className="font-bold">AI가 채운 기본값</h3>
                    <p className="mt-1 text-sm text-muted-foreground">정답이 아닙니다. 바꿔도 됩니다.</p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-[1.65]">
                      {data.result.assumptions.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" onClick={copyFinal} className="btn-primary">
                <Copy className="size-5" aria-hidden="true" />
                최종 프롬프트 복사
              </button>
              <button type="button" onClick={download} className="btn-quiet">
                <Download className="size-5" aria-hidden="true" />
                TXT로 내려받기
              </button>
              <a href={CANVA_AI_URL} target="_blank" rel="noopener noreferrer" className="btn-quiet">
                Canva 열기
                <ExternalLink className="size-5" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              이 컴퓨터에만 저장됩니다. 다음 시간을 위해 TXT로도 내려받아 두세요.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="reset" className="border-t border-input pt-8">
        <h2 id="reset" className="font-bold">
          공용 컴퓨터라면
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">수업이 끝나면 저장된 내용을 지워 주세요.</p>
        {confirmReset ? (
          <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span>모두 지워집니다. TXT로 내려받았나요?</span>
            <button type="button" onClick={reset} className="font-bold text-destructive underline">
              모두 지우기
            </button>
            <button type="button" onClick={() => setConfirmReset(false)} className="underline">
              취소
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} disabled={isEmpty(data)} className="btn-quiet btn-sm mt-3">
            <Trash2 className="size-4" aria-hidden="true" />
            저장된 내용 지우기
          </button>
        )}
      </section>
    </div>
  );
}
