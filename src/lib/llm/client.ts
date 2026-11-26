import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * LLM 호출 설정은 이 폴더(src/lib/llm)에만 둔다.
 * 모델이나 제공사를 바꿀 때 여기와 suggest.ts, finalize.ts만 고치면 된다.
 */

/** 기능 제안과 최종 프롬프트 정리에 쓰는 모델 */
export const MODEL = process.env.PROMPTLAB_MODEL ?? "claude-opus-5-5";

/**
 * 동시에 AI로 보내는 요청 수의 상한.
 * 한 반이 같은 순간에 버튼을 누르면 30건이 한꺼번에 나가는데, 부하 시험에서 25건을 넘는 동시 요청은
 * AI 서버가 429로 거절했다. 그래서 상한을 넘는 요청은 거절당하게 두지 않고 여기서 차례를 기다리게 한다.
 */
const MAX_CONCURRENT = Number(process.env.PROMPTLAB_MAX_CONCURRENT ?? 16);

let running = 0;
const waiting: (() => void)[] = [];

/** 빈자리가 날 때까지 기다렸다가 fn을 실행한다. 먼저 온 요청이 먼저 나간다. */
export async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else {
    running++;
  }
  try {
    return await fn();
  } finally {
    const next = waiting.shift();
    // 기다리던 요청이 있으면 자리를 그대로 넘겨준다(running은 그대로). 없으면 자리를 비운다.
    if (next) next();
    else running--;
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 요청이 몰려 거절(429)당했을 때 서버가 스스로 다시 보내는 횟수 */
const MAX_BUSY_RETRIES = 5;

/**
 * AI 호출을 감싼다. 대기열(withSlot)로 동시 요청을 줄이고, 그래도 "요청이 몰림"으로 거절되면
 * 간격을 늘려 가며 다시 보낸다.
 *
 * 대기열만으로는 부족하다. Vercel은 서버를 여러 대로 나눠 실행하고 대기열은 한 대의 메모리에만 있어서,
 * 배포 환경 부하 시험에서 30명 동시 요청 146건 중 7건이 429로 실패했다. 기다리는 동안에는 자리를 비워
 * 다른 요청이 먼저 나가게 하고, 여러 요청이 같은 순간에 다시 몰리지 않도록 대기 시간을 조금씩 흩는다.
 */
export async function callAi<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await withSlot(fn);
    } catch (error) {
      if (!(error instanceof Anthropic.RateLimitError) || attempt >= MAX_BUSY_RETRIES) throw error;
      await sleep(1500 * (attempt + 1) + Math.random() * 2500);
    }
  }
}

let client: Anthropic | null = null;

export function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** API 키는 서버 환경변수 ANTHROPIC_API_KEY에서만 읽는다. 브라우저로 보내지 않는다. */
export function getClient() {
  // 일시적 오류(5xx, 연결 끊김)는 SDK가 두 번까지 다시 시도하고, 한 번의 시도는 60초를 넘기지 않는다.
  // (단위: 밀리초) 요청이 몰려 생기는 429는 callAi가 더 긴 간격으로 따로 다시 보낸다.
  client ??= new Anthropic({ maxRetries: 2, timeout: 60_000 });
  return client;
}

/**
 * SDK 오류를 학생에게 보여 줄 문장과 HTTP 상태로 바꾼다.
 * retryable이 true면 잠시 뒤 다시 보내면 될 가능성이 높은 오류다. 브라우저가 자동으로 한두 번 더 시도한다.
 */
export function describeError(error: unknown): {
  status: number;
  message: string;
  retryable: boolean;
} {
  if (error instanceof Anthropic.RateLimitError) {
    return {
      status: 429,
      message:
        "지금 요청이 많이 몰려 있습니다. 30초쯤 뒤에 다시 시도해 주세요.",
      retryable: true,
    };
  }
  if (
    error instanceof Anthropic.AuthenticationError ||
    error instanceof Anthropic.PermissionDeniedError
  ) {
    return {
      status: 503,
      message: "AI 연결 설정에 문제가 있습니다. 선생님께 알려 주세요.",
      retryable: false,
    };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return {
      status: 502,
      message:
        "AI가 이 요청을 처리하지 못했습니다. 내용을 조금 바꿔 다시 시도해 주세요.",
      retryable: false,
    };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return {
      status: 504,
      message: "AI 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      retryable: true,
    };
  }
  if (error instanceof Anthropic.APIError) {
    return {
      status: 502,
      message:
        "AI 서버에 일시적인 문제가 있습니다. 잠시 뒤 다시 시도해 주세요.",
      retryable: true,
    };
  }
  return {
    status: 500,
    message: "알 수 없는 문제가 생겼습니다. 다시 시도해 주세요.",
    retryable: false,
  };
}
