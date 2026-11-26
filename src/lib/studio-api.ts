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

async function readError(res: Response): Promise<{ message: string; retryable: boolean }> {
  try {
    const data = (await res.json()) as { error?: string; retryable?: boolean };
    if (data.error) return { message: data.error, retryable: Boolean(data.retryable) };
  } catch {
    /* 본문이 JSON이 아니면 아래 기본 문장을 쓴다 */
  }
  // 우리 서버가 만든 응답이 아니면(호스팅의 시간 초과 등) 다시 시도해 볼 만하다.
  return { message: "요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.", retryable: res.status >= 500 };
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

/** 다시 시도하기 전에 기다리는 시간(밀리초). 여러 학생이 같은 순간에 다시 보내지 않도록 조금씩 흩는다. */
const RETRY_WAITS = [2000, 5000];

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      window.clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });

/**
 * 우리 서버의 AI API를 부른다. 요청이 몰려 생기는 일시적 오류는 학생에게 보이기 전에 두 번까지 다시 시도한다.
 * 접속 코드 오류, 개인정보 차단, 횟수 초과처럼 다시 보내도 소용없는 오류는 바로 알린다.
 */
async function post<T>(url: string, body: unknown, code: string, signal?: AbortSignal): Promise<T> {
  let last = new StudioApiError("요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.", 0);
  for (let attempt = 0; attempt <= RETRY_WAITS.length; attempt++) {
    if (attempt > 0) await wait(RETRY_WAITS[attempt - 1] + Math.random() * 1500, signal);
    let res: Response;
    try {
      res = await fetch(url, { method: "POST", headers: headers(code), body: JSON.stringify(body), signal });
    } catch (e) {
      if (signal?.aborted) throw e;
      last = new StudioApiError("서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.", 0);
      continue;
    }
    if (res.ok) return await res.json();
    const err = await readError(res);
    last = new StudioApiError(err.message, res.status);
    if (!err.retryable) break;
  }
  throw last;
}

/** 2단계: 사용 대상과 문제를 보내 기능을 제안받는다. */
export function requestSuggest(prompt: string, code: string, signal?: AbortSignal) {
  return post<Suggestion>("/api/suggest", { prompt }, code, signal);
}

/** 3단계 보조: 2단계에서 정한 프롬프트를 보내 앱 이용 순서 초안을 받는다. */
export function requestFlow(prompt: string, code: string, signal?: AbortSignal) {
  return post<{ steps: string[] }>("/api/flow", { prompt }, code, signal);
}

/** 3단계: 정한 프롬프트와 이용 순서를 보내 최종 프롬프트를 받는다. */
export function requestFinalize(prompt: string, flow: string, code: string, signal?: AbortSignal) {
  return post<FinalResult>("/api/finalize", { prompt, flow }, code, signal);
}
