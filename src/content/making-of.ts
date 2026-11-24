/**
 * 이 사이트의 실제 제작 기록.
 * 원칙: 실제로 있었던 일만 적는다. 아직 일어나지 않은 단계는 status를 "pending"으로 두고 내용을 지어내지 않는다.
 */
export type MakingStep = {
  title: string;
  status: "done" | "pending";
  who?: "사람" | "AI" | "사람 + AI";
  body?: string;
  quote?: string;
};

export const makingPurpose =
  "내가 쓴 프롬프트가 결과를 어떻게 바꾸는지 눈으로 보게 하려고 만들었습니다.";

export const makingSteps: MakingStep[] = [
  {
    title: "최초 개발 기획 프롬프트",
    status: "done",
    who: "사람",
    body: "23개 항목의 기획서를 사람이 먼저 썼습니다.",
    quote: "이거로 웹 페이지 만들거야 일단 이거 기억해",
  },
  {
    title: "만들기 전에 확인한 것",
    status: "done",
    who: "사람 + AI",
    body: "AI 연결에 비용이 든다는 것을 확인하고, 나머지부터 만들기로 했습니다.",
    quote: "일단 그러면 llm부분 제외하고 작업 진행해줘",
  },
  {
    title: "첫 번째 개발 결과물",
    status: "done",
    who: "AI",
    body: "네 페이지의 첫 버전이 나왔고, 이후 AI 기능을 붙였습니다.",
  },
  {
    title: "개발 과정에서 발견한 문제점",
    status: "done",
    who: "사람 + AI",
    body: "API 키 설정이 틀려 요청이 거절됐고, AI가 쓴 프롬프트에 작동하지 않는 기능이 들어 있었습니다. 직접 돌려 보고서야 찾았습니다.",
  },
  {
    title: "디자인 및 기능 개선 요청",
    status: "done",
    who: "사람 + AI",
    body: "첫 디자인은 흔한 AI 서비스 모습이었습니다. 사람이 정리해 둔 디자인 원칙을 읽히고 다시 만들게 했습니다.",
    quote: "ai 느낌 안나게 웹 다시 작업해봐",
  },
  { title: "최종 완성 결과물", status: "pending" },
];
