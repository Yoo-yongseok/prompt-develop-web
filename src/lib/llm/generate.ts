import "server-only";
import { CODEGEN, describeError, getClient } from "./client";
import { CODEGEN_SYSTEM } from "./codegen-prompt";
import { STATUS_MARK, type GenerateStatus } from "./protocol";

/**
 * 프롬프트 하나로 미니 웹앱 HTML을 생성해 글자 단위로 흘려보낸다.
 *
 * 공정성: 이 함수는 받은 프롬프트가 학생의 원문인지 AI와 발전시킨 것인지 알지 못한다.
 * 모델, 시스템 프롬프트, 토큰 한도, effort는 모든 요청에 똑같이 적용된다.
 * 같은 이유로, 거절 시 다른 모델로 넘기는 fallback은 쓰지 않는다.
 * 시스템 프롬프트(codegen-prompt.ts)는 "적힌 것만 만든다"는 규칙이며 모든 요청에 똑같이 쓴다.
 */
export function generateAppStream(prompt: string, signal?: AbortSignal): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const finish = (status: GenerateStatus) => {
        controller.enqueue(encoder.encode(STATUS_MARK + JSON.stringify(status)));
        controller.close();
      };

      try {
        const stream = getClient().messages.stream(
          {
            model: CODEGEN.model,
            max_tokens: CODEGEN.maxTokens,
            system: CODEGEN_SYSTEM,
            messages: [{ role: "user", content: prompt }],
            output_config: { effort: CODEGEN.effort },
          },
          { signal },
        );

        stream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
        const message = await stream.finalMessage();

        if (message.stop_reason === "refusal") {
          finish({ ok: false, reason: "refused", message: "AI가 이 요청으로는 앱을 만들지 않았습니다. 프롬프트 내용을 확인해 주세요." });
        } else if (message.stop_reason === "max_tokens") {
          finish({ ok: false, reason: "truncated", message: "앱이 너무 커서 끝까지 만들지 못했습니다. 핵심 기능 1~3개로 줄여 다시 시도해 주세요." });
        } else {
          finish({ ok: true });
        }
      } catch (error) {
        if (signal?.aborted) {
          controller.close();
          return;
        }
        finish({ ok: false, reason: "error", message: describeError(error).message });
      }
    },
  });
}
