import type { FinalResult, Suggestion } from "@/lib/llm/protocol";

/** 브라우저에서 우리 서버의 AI API를 부르는 함수들. LLM을 직접 부르지 않는다. */

const CODE_KEY = "promptlab:class-code";

export function getClassCode() {
  try {
    return window.sessionStorage.getItem(CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setClassCode(code: string) {
  try {
    window.sessionStorage.setItem(CODE_KEY, code);
  } catch {
    /* 저장하지 못해도 이번 요청에는 쓸 수 있다 */
  }
}

function headers(code: string) {
  return {
    "Content-Type": "application/json",
    ...(code ? { "x-class-code": encodeURIComponent(code) } : {}),
  };
}

async function errorMessage(res: Response) {
  try {
    const data = (await res.json()) as { error?: string };
    if (data.error) return data.error;
  } catch {
    /* 본문이 JSON이 아니면 아래 기본 문장을 쓴다 */
  }
  return "요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
}

export class StudioApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function fetchStatus(): Promise<{ aiReady: boolean; codeRequired: boolean }> {
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    if (!res.ok) return { aiReady: false, codeRequired: false };
    return await res.json();
  } catch {
    return { aiReady: false, codeRequired: false };
  }
}

async function post<T>(url: string, body: unknown, code: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: headers(code), body: JSON.stringify(body), signal });
  } catch {
    throw new StudioApiError("서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.", 0);
  }
  if (!res.ok) throw new StudioApiError(await errorMessage(res), res.status);
  return await res.json();
}

/** 2단계: 사용 대상과 문제를 보내 기능을 제안받는다. */
export function requestSuggest(prompt: string, code: string, signal?: AbortSignal) {
  return post<Suggestion>("/api/suggest", { prompt }, code, signal);
}

/** 3단계: 정한 프롬프트와 이용 순서를 보내 최종 프롬프트를 받는다. */
export function requestFinalize(prompt: string, flow: string, code: string, signal?: AbortSignal) {
  return post<FinalResult>("/api/finalize", { prompt, flow }, code, signal);
}
