import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * LLM 호출 설정은 이 폴더(src/lib/llm)에만 둔다.
 * 모델이나 제공사를 바꿀 때 여기와 suggest.ts, finalize.ts만 고치면 된다.
 */

/** 기능 제안과 최종 프롬프트 정리에 쓰는 모델 */
export const MODEL = process.env.PROMPTLAB_MODEL ?? "claude-opus-5-5";

let client: Anthropic | null = null;

export function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** API 키는 서버 환경변수 ANTHROPIC_API_KEY에서만 읽는다. 브라우저로 보내지 않는다. */
export function getClient() {
  client ??= new Anthropic({ maxRetries: 2 });
  return client;
}

/** SDK 오류를 학생에게 보여 줄 문장과 HTTP 상태로 바꾼다. */
export function describeError(error: unknown): { status: number; message: string } {
  if (error instanceof Anthropic.RateLimitError) {
    return {
      status: 429,
      message: "지금 요청이 많이 몰려 있습니다. 30초쯤 뒤에 다시 시도해 주세요.",
    };
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return { status: 503, message: "AI 연결 설정에 문제가 있습니다. 선생님께 알려 주세요." };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return { status: 502, message: "AI가 이 요청을 처리하지 못했습니다. 내용을 조금 바꿔 다시 시도해 주세요." };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return { status: 504, message: "AI 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }
  if (error instanceof Anthropic.APIError) {
    return { status: 502, message: "AI 서버에 일시적인 문제가 있습니다. 잠시 뒤 다시 시도해 주세요." };
  }
  return { status: 500, message: "알 수 없는 문제가 생겼습니다. 다시 시도해 주세요." };
}
