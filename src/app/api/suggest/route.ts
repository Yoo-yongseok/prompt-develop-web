import { z } from "zod";
import { findPersonalInfo, guard, jsonError } from "@/lib/guard";
import { describeError, hasApiKey } from "@/lib/llm/client";
import { suggestFeatures } from "@/lib/llm/suggest";

export const maxDuration = 120;

const Body = z.object({ prompt: z.string().trim().min(10).max(1500) });

/** 2단계: 사용 대상과 문제를 받아 기능을 제안한다. */
export async function POST(request: Request) {
  if (!hasApiKey()) return jsonError(503, "AI가 아직 연결되지 않았습니다.");

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "10자 이상 1500자 이하로 써 주세요.");

  const personal = findPersonalInfo(parsed.data.prompt);
  if (personal) {
    return jsonError(400, `${personal}로 보이는 내용이 있습니다. 개인정보는 지우고 다시 시도해 주세요.`);
  }

  const allowed = guard(request, "suggest");
  if (!allowed.ok) return jsonError(allowed.status, allowed.message);

  try {
    // 학생의 글은 로그나 저장소에 남기지 않는다.
    const result = await suggestFeatures(parsed.data.prompt);
    if (!result.ok) {
      return jsonError(
        502,
        result.reason === "refused"
          ? "AI가 이 내용으로는 도와줄 수 없다고 답했습니다. 내용을 확인해 주세요."
          : "AI의 답을 끝까지 받지 못했습니다. 다시 시도해 주세요.",
      );
    }
    return Response.json(result.data);
  } catch (error) {
    const { status, message } = describeError(error);
    return jsonError(status, message);
  }
}
