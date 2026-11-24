/**
 * 브라우저 안에만 저장한다. 서버로 보내지 않는다.
 * 공용 PC에서는 지워질 수 있으므로 TXT 내려받기를 함께 제공한다.
 */
import type { Analysis } from "@/lib/llm/protocol";

const KEY = "promptlab:v1";

export type StudioData = {
  /** 학생이 처음 쓴 프롬프트. AI가 고치지 않는다. */
  original: string;
  /** 학생이 직접 다듬은 최종 프롬프트 */
  final: string;
  /** AI가 분석한 결과. 어떤 원문을 분석했는지 함께 보관한다. */
  analysis?: Analysis & { originalPrompt: string };
  /** Explore에서 가져온 사례 이름 */
  source?: string;
  savedAt?: string;
};

export const emptyStudio: StudioData = { original: "", final: "" };

export function loadStudio(): StudioData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStudio;
    const data = JSON.parse(raw) as Partial<StudioData>;
    return {
      original: typeof data.original === "string" ? data.original : "",
      final: typeof data.final === "string" ? data.final : "",
      analysis:
        data.analysis && typeof data.analysis.improvedPrompt === "string" ? data.analysis : undefined,
      source: typeof data.source === "string" ? data.source : undefined,
      savedAt: typeof data.savedAt === "string" ? data.savedAt : undefined,
    };
  } catch {
    return emptyStudio;
  }
}

/** 저장에 성공하면 true. 저장소를 쓸 수 없는 브라우저에서는 false. */
export function saveStudio(data: StudioData): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearStudio() {
  try {
    window.localStorage.removeItem(KEY);
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
