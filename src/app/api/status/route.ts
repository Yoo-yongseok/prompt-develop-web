import { connection } from "next/server";
import { accessCodeRequired } from "@/lib/guard";
import { hasApiKey } from "@/lib/llm/client";

/** 브라우저가 AI 기능을 쓸 수 있는지, 접속 코드가 필요한지 확인한다. 키 값은 절대 내보내지 않는다. */
export async function GET() {
  await connection();
  return Response.json(
    { aiReady: hasApiKey(), codeRequired: accessCodeRequired() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
