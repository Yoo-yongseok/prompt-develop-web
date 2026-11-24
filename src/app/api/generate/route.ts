import { z } from "zod";
import { findPersonalInfo, guard, jsonError } from "@/lib/guard";
import { hasApiKey } from "@/lib/llm/client";
import { generateAppStream } from "@/lib/llm/generate";

export const maxDuration = 300;

// 프롬프트 하나만 받는다. Before인지 After인지는 받지도 전달하지도 않는다.
const Body = z.object({ prompt: z.string().trim().min(10).max(6000) });

export async function POST(request: Request) {
  if (!hasApiKey()) return jsonError(503, "AI가 아직 연결되지 않았습니다.");

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, "프롬프트는 10자 이상 6000자 이하로 써 주세요.");
  }

  const personal = findPersonalInfo(parsed.data.prompt);
  if (personal) {
    return jsonError(400, `${personal}로 보이는 내용이 있습니다. 개인정보는 지우고 다시 시도해 주세요.`);
  }

  const allowed = guard(request, "generate");
  if (!allowed.ok) return jsonError(allowed.status, allowed.message);

  return new Response(generateAppStream(parsed.data.prompt, request.signal), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
