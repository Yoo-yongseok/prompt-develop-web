"use client";

import { useState } from "react";
import { SandboxFrame } from "@/components/sandbox-frame";

/**
 * 랜딩 첫 화면의 직접 만져 보는 데모.
 * 프롬프트를 고르면 그 프롬프트로 실제 생성된 앱이 바뀐다. 그림이 아니라 작동하는 앱이다.
 */
const steps = [
  {
    id: 1,
    label: "한 줄 요청",
    prompt: "운동 기록 앱 만들어줘.",
  },
  {
    id: 2,
    label: "다섯 가지를 담은 요청",
    prompt:
      "운동을 좋아하는 학생들이 꾸준히 운동하는 습관을 만들 수 있도록 앱을 만들어줘. 운동 시간을 기록하고 하루 운동 목표를 설정할 수 있으면 좋겠어.",
  },
  {
    id: 3,
    label: "AI와 함께 구체화한 요청",
    prompt:
      "운동 습관을 형성하고 싶은 청소년을 위한 게임형 운동 기록 웹앱을 만들어줘. 운동 10분당 10포인트를 지급하고, 누적 100포인트마다 레벨이 상승한다.",
  },
] as const;

export function HeroDemo({ htmlByLevel }: { htmlByLevel: Record<number, string | null> }) {
  const [active, setActive] = useState<1 | 2 | 3>(1);
  const step = steps.find((s) => s.id === active)!;
  const html = htmlByLevel[active];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)] lg:gap-5">
      <div role="tablist" aria-label="프롬프트 고르기" aria-orientation="vertical" className="flex flex-col gap-2">
        {steps.map((s) => {
          const on = s.id === active;
          return (
            <button
              key={s.id}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setActive(s.id)}
              className={
                "rounded-[20px] border p-5 text-left transition-colors duration-150 " +
                (on ? "border-foreground bg-background" : "border-transparent bg-card hover:border-input")
              }
            >
              <span className="text-[15px] font-semibold text-muted-foreground">{s.label}</span>
              <span className={"mt-1.5 block text-[17px] leading-relaxed " + (on ? "" : "line-clamp-2 text-muted-foreground")}>
                {s.prompt}
              </span>
            </button>
          );
        })}
        <p className="mt-1 px-1 text-sm leading-relaxed text-muted-foreground">
          같은 AI, 같은 조건, 다른 프롬프트.
        </p>
      </div>

      <div role="tabpanel">
        {html ? (
          <SandboxFrame
            key={active}
            html={html}
            title={`이 프롬프트로 실제 생성된 앱 (${step.label})`}
            className="h-[520px] rounded-[28px] lg:h-[600px]"
          />
        ) : (
          <div className="grid h-[520px] place-items-center rounded-[28px] bg-card p-6 text-center text-muted-foreground">
            결과물 파일이 아직 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
