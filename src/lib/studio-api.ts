import { STATUS_MARK, type Analysis, type GenerateStatus } from "@/lib/llm/protocol";

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

export async function requestImprove(
  prompt: string,
  answers: { question: string; answer: string }[],
  code: string,
  signal?: AbortSignal,
): Promise<Analysis & { originalPrompt: string }> {
  let res: Response;
  try {
    res = await fetch("/api/improve", {
      method: "POST",
      headers: headers(code),
      body: JSON.stringify({ prompt, answers }),
      signal,
    });
  } catch {
    throw new StudioApiError("서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.", 0);
  }
  if (!res.ok) throw new StudioApiError(await errorMessage(res), res.status);
  return await res.json();
}

/**
 * 프롬프트 하나로 미니 웹앱을 만든다. 만들어지는 동안 받은 글자 수를 onProgress로 알려 준다.
 * Before와 After 모두 이 함수를 똑같이 쓴다. 서버에는 프롬프트만 보낸다.
 */
export async function requestGenerate(
  prompt: string,
  code: string,
  onProgress: (chars: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: headers(code),
      body: JSON.stringify({ prompt }),
      signal,
    });
  } catch {
    throw new StudioApiError("서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.", 0);
  }
  if (!res.ok || !res.body) throw new StudioApiError(await errorMessage(res), res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      onProgress(text.length);
    }
    text += decoder.decode();
  } catch {
    throw new StudioApiError("앱을 받는 중에 연결이 끊겼습니다. 다시 만들어 주세요.", 0);
  }

  const at = text.lastIndexOf(STATUS_MARK);
  if (at === -1) {
    throw new StudioApiError("앱을 끝까지 받지 못했습니다. 다시 만들어 주세요.", 0);
  }
  const status = JSON.parse(text.slice(at + STATUS_MARK.length)) as GenerateStatus;
  if (!status.ok) throw new StudioApiError(status.message, 0);
  return text.slice(0, at);
}
