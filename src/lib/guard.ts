import "server-only";

/**
 * API 남용 방지.
 *
 * - 수업용 접속 코드: 환경변수 CLASS_ACCESS_CODE를 설정하면 그 코드를 아는 사람만 AI 기능을 쓸 수 있다.
 * - 횟수 제한: 접속자(IP)별 시간당 횟수와 서버 전체 하루 횟수를 제한한다.
 *
 * 주의: 횟수는 서버 메모리에 저장한다. Vercel처럼 인스턴스가 여러 개 뜨는 환경에서는
 * 인스턴스마다 따로 세어지므로 정확한 상한이 아니다. 비용의 최종 상한은 Claude Console의
 * 워크스페이스 지출 한도로 걸어 둔다. 정확한 학급 단위 제한이 필요하면 이 파일의 저장소를
 * Upstash Redis 같은 공유 저장소로 바꾼다.
 */

type Kind = "suggest" | "finalize";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const perIpPerHour: Record<Kind, number> = {
  suggest: Number(process.env.LIMIT_SUGGEST_PER_HOUR ?? 15),
  finalize: Number(process.env.LIMIT_FINALIZE_PER_HOUR ?? 15),
};
const globalPerDay = Number(process.env.LIMIT_TOTAL_PER_DAY ?? 600);

const hits = new Map<string, number[]>();
let globalHits: number[] = [];

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export type GuardResult = { ok: true } | { ok: false; status: number; message: string };

export function accessCodeRequired() {
  return Boolean(process.env.CLASS_ACCESS_CODE);
}

export function guard(request: Request, kind: Kind): GuardResult {
  const required = process.env.CLASS_ACCESS_CODE;
  if (required) {
    // 한글 코드도 헤더로 보낼 수 있도록 브라우저에서 encodeURIComponent로 감싸 보낸다.
    let given = "";
    try {
      given = decodeURIComponent(request.headers.get("x-class-code") ?? "").trim();
    } catch {
      given = "";
    }
    if (given !== required) {
      return { ok: false, status: 401, message: "수업 접속 코드가 맞지 않습니다. 선생님이 알려 준 코드를 확인해 주세요." };
    }
  }

  const now = Date.now();

  globalHits = globalHits.filter((t) => now - t < DAY);
  if (globalHits.length >= globalPerDay) {
    return { ok: false, status: 429, message: "오늘 사용할 수 있는 AI 요청 횟수를 모두 썼습니다. 선생님께 알려 주세요." };
  }

  const key = `${kind}:${clientKey(request)}`;
  const mine = (hits.get(key) ?? []).filter((t) => now - t < HOUR);
  if (mine.length >= perIpPerHour[kind]) {
    hits.set(key, mine);
    const wait = Math.ceil((HOUR - (now - mine[0])) / 60000);
    return { ok: false, status: 429, message: `요청 횟수가 많습니다. 약 ${wait}분 뒤에 다시 시도해 주세요.` };
  }

  mine.push(now);
  hits.set(key, mine);
  globalHits.push(now);
  return { ok: true };
}

/** 실명·연락처 같은 개인정보로 보이는 내용을 찾는다. 찾으면 무엇인지 알려 준다. */
export function findPersonalInfo(text: string): string | null {
  if (/\b\d{6}\s*-\s*[1-4]\d{6}\b/.test(text)) return "주민등록번호";
  if (/\b01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}\b/.test(text)) return "전화번호";
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(text)) return "이메일 주소";
  return null;
}

export function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
