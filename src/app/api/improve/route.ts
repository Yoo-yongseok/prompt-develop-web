import { z } from "zod";
import { findPersonalInfo, guard, jsonError } from "@/lib/guard";
import { describeError, hasApiKey } from "@/lib/llm/client";
import { improvePrompt } from "@/lib/llm/improve";

export const maxDuration = 120;

const Body = z.object({
  prompt: z.string().trim().min(10).max(2000),
  answers: z
    .array(z.object({ question: z.string().max(300), answer: z.string().max(300) }))
    .max(2)
    .optional(),
});

export async function POST(request: Request) {
  if (!hasApiKey()) return jsonError(503, "AI가 아직 연결되지 않았습니다.");

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, "프롬프트는 10자 이상 2000자 이하로 써 주세요.");
  }
  const { prompt, answers } = parsed.data;

  const personal = findPersonalInfo(prompt + "\n" + (answers ?? []).map((a) => a.answer).join("\n"));
  if (personal) {
    return jsonError(400, `${personal}로 보이는 내용이 있습니다. 개인정보는 지우고 다시 시도해 주세요.`);
  }

  const allowed = guard(request, "improve");
  if (!allowed.ok) return jsonError(allowed.status, allowed.message);

  try {
    // 학생의 프롬프트는 로그나 저장소에 남기지 않는다.
    const result = await improvePrompt(prompt, answers);
    if (!result.ok) {
      return jsonError(
        502,
        result.reason === "refused"
          ? "AI가 이 내용으로는 도와줄 수 없다고 답했습니다. 프롬프트 내용을 확인해 주세요."
          : "AI의 답을 끝까지 받지 못했습니다. 다시 시도해 주세요.",
      );
    }
    // 원문은 서버가 그대로 돌려준다. AI가 고쳐 쓰지 못하게 하기 위해서다.
    return Response.json({ originalPrompt: prompt, ...result.analysis });
  } catch (error) {
    const { status, message } = describeError(error);
    return jsonError(status, message);
  }
}
