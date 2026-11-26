/**
 * 브라우저 안에만 저장한다. 서버로 보내지 않는다.
 * 공용 PC에서는 지워질 수 있으므로 TXT 내려받기를 함께 제공한다.
 */
import type { Feature, FinalResult, Suggestion } from "@/lib/llm/protocol";

const KEY = "promptlab:v2";

export type MakerData = {
  // 1단계: 문제 찾기
  fieldId: string;
  who: string;
  problem: string;
  // 2단계: 기능 정하기
  /** 학생이 AI에게 보낸 글 */
  ask: string;
  suggestion: Suggestion | null;
  /** 학생이 고른 기능 (AI 제안 + 직접 추가) */
  chosen: Feature[];
  /** 고른 기능으로 만든 프롬프트. 학생이 직접 고칠 수 있다. */
  prompt: string;
  // 3단계: 화면 순서
  flow: string;
  result: FinalResult | null;
  /** 학생이 검토한 최종 프롬프트 */
  finalPrompt: string;
};

export const emptyMaker: MakerData = {
  fieldId: "",
  who: "",
  problem: "",
  ask: "",
  suggestion: null,
  chosen: [],
  prompt: "",
  flow: "",
  result: null,
  finalPrompt: "",
};

export function isEmpty(d: MakerData) {
  return !d.fieldId && !d.who && !d.problem && !d.ask && !d.prompt && !d.flow && !d.finalPrompt;
}

export function loadMaker(): MakerData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyMaker;
    const d = JSON.parse(raw) as Partial<MakerData>;
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    return {
      fieldId: str(d.fieldId),
      who: str(d.who),
      problem: str(d.problem),
      ask: str(d.ask),
      suggestion: d.suggestion && Array.isArray(d.suggestion.features) ? d.suggestion : null,
      chosen: Array.isArray(d.chosen) ? d.chosen : [],
      prompt: str(d.prompt),
      flow: str(d.flow),
      result: d.result && typeof d.result.finalPrompt === "string" ? d.result : null,
      finalPrompt: str(d.finalPrompt),
    };
  } catch {
    return emptyMaker;
  }
}

/** 저장에 성공하면 true. 저장소를 쓸 수 없는 브라우저에서는 false. */
export function saveMaker(data: MakerData): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearMaker() {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem("promptlab:v1");
  } catch {
    /* 저장소를 쓸 수 없으면 지울 것도 없다 */
  }
}

export function downloadText(filename: string, text: string) {
  // 메모장에서 한글이 깨지지 않도록 BOM을 붙인다.
  const blob = new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 학교 PC의 오래된 브라우저나 http 환경을 위한 대체 방법
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
