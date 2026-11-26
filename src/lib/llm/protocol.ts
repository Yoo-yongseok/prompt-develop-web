/** 서버와 브라우저가 함께 쓰는 타입. 서버 전용 코드를 넣지 않는다. */

/** AI가 제안한 기능 하나 */
export type Feature = {
  /** 짧은 이름 */
  name: string;
  /** 무엇을 하면 무엇이 보이는지 */
  detail: string;
  /** 이 기능이 문제를 어떻게 푸는지 */
  reason: string;
};

/** 2단계 결과: 앱 소개와 기능 제안 */
export type Suggestion = {
  intro: string;
  features: Feature[];
  praise: string;
};

/** 3단계 결과: 최종 프롬프트 */
export type FinalResult = {
  finalPrompt: string;
  changes: string[];
  assumptions: string[];
};
