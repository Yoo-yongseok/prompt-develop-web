export type ElementKey = "why" | "who" | "what" | "how" | "rules";

export type PromptElement = {
  key: ElementKey;
  name: string;
  en: string;
  question: string;
  example: string;
  /** 요소별 고유 색. 프롬프트 문장 강조에 같은 색을 쓴다. 흰 바탕에서 글자로 읽히는 명도다. */
  color: string;
};

export const elements: PromptElement[] = [
  {
    key: "why",
    name: "목적",
    en: "Why",
    question: "왜 만들고 싶은가?",
    example: "매일 운동한 시간을 기록하고 꾸준히 운동하는 습관을 만들고 싶다.",
    color: "#b4530a",
  },
  {
    key: "who",
    name: "대상",
    en: "Who",
    question: "누가 사용할 것인가?",
    example: "운동을 좋아하거나 운동을 처음 시작하는 청소년.",
    color: "#0b7a70",
  },
  {
    key: "what",
    name: "기능",
    en: "What",
    question: "무엇을 할 수 있어야 하는가?",
    example: "운동 기록, 운동 목표 설정, 주간 운동 통계.",
    color: "#2450f0",
  },
  {
    key: "how",
    name: "디자인",
    en: "How",
    question: "어떤 모습과 방식으로 만들 것인가?",
    example: "검은색과 초록색을 활용한 스포티한 디자인.",
    color: "#b0237c",
  },
  {
    key: "rules",
    name: "조건",
    en: "Rules",
    question: "반드시 지켜야 할 기준은 무엇인가?",
    example: "모든 버튼이 실제로 작동하고 모바일에서도 사용할 수 있어야 한다.",
    color: "#6b5200",
  },
];

/** Level 2 예시 프롬프트를 문장 단위로 나누고, 각 문장이 담고 있는 요소를 표시한다. */
export const annotatedPrompt: { text: string; keys: ElementKey[] }[] = [
  {
    text: "운동을 좋아하는 학생들이 꾸준히 운동하는 습관을 만들 수 있도록 앱을 만들어줘.",
    keys: ["who", "why"],
  },
  {
    text: "운동 시간을 기록하고 하루 운동 목표를 설정할 수 있으면 좋겠어.",
    keys: ["what"],
  },
  {
    text: "운동한 내용을 그래프로 보여주고 운동할 때마다 포인트도 줬으면 좋겠어.",
    keys: ["what"],
  },
  { text: "검은색과 초록색을 사용해서 멋있게 만들어줘.", keys: ["how"] },
  {
    text: "모든 버튼이 실제로 작동하고 스마트폰에서도 사용할 수 있게 해줘.",
    keys: ["rules"],
  },
];

export const everydayUses = [
  "학교 보고서 작성",
  "발표자료 제작",
  "디자인·콘텐츠 제작",
  "자료 조사",
  "진로 탐색",
  "여행 계획 수립",
  "업무 자동화",
  "제품·서비스 기획",
];

export const feedbackPairs = [
  {
    vague: "더 예쁘게 만들어줘.",
    specific: "배경을 흰색으로 변경하고 주요 버튼을 파란색으로 통일해줘.",
  },
  {
    vague: "오류 고쳐줘.",
    specific:
      "운동 기록을 삭제했는데 총 운동 시간이 변경되지 않아. 기록을 삭제하면 총 운동 시간과 목표 달성률도 다시 계산해줘.",
  },
  {
    vague: "다시 만들어줘.",
    specific:
      "기존 기능은 유지하면서 모바일 화면에서 글씨가 잘 보이도록 크기와 버튼 배치를 수정해줘.",
  },
];
