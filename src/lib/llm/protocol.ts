/** 서버와 브라우저가 함께 쓰는 약속. 서버 전용 코드를 넣지 않는다. */

/**
 * 생성 스트림 끝에 붙는 상태 줄의 구분자.
 * 본문(HTML)과 섞이지 않도록 제어 문자를 쓴다.
 */
export const STATUS_MARK = "\u001ePROMPTLAB_STATUS";

export type GenerateStatus =
  | { ok: true }
  | { ok: false; reason: "refused" | "truncated" | "error"; message: string };

export type Analysis = {
  improvedPrompt: string;
  strengths: string[];
  improvements: { before: string; after: string; reason: string }[];
  assumptions: string[];
  followUpQuestions: string[];
  learningSummary: string;
};
