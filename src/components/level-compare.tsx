"use client";

import { useState } from "react";
import { levels, type Level } from "@/content/levels";
import { SandboxFrame } from "@/components/sandbox-frame";

type Demo = Level & { html: string | null };

function PromptBox({ level, open, fixed }: { level: Demo; open: boolean; fixed?: boolean }) {
  if (!open) return null;
  return (
    <pre
      className={
        (fixed ? "h-64 " : "max-h-64 ") +
        "overflow-auto whitespace-pre-wrap rounded-xl bg-card p-5 font-sans text-sm leading-relaxed"
      }
    >
      {level.prompt}
    </pre>
  );
}

function Result({ level }: { level: Demo }) {
  if (!level.html) {
    return (
      <div className="grid h-80 place-items-center rounded-[20px] border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
        결과물 파일이 없습니다: {level.file}
      </div>
    );
  }
  return (
    <SandboxFrame
      html={level.html}
      title={`Level ${level.id} 프롬프트로 실제 생성된 앱`}
    />
  );
}

export function LevelCompare({ htmlByLevel }: { htmlByLevel: Record<number, string | null> }) {
  const demos: Demo[] = levels.map((l) => ({ ...l, html: htmlByLevel[l.id] ?? null }));
  const [view, setView] = useState<"tabs" | "split">("tabs");
  const [active, setActive] = useState<1 | 2 | 3>(1);
  const [showPrompt, setShowPrompt] = useState(true);
  const current = demos.find((d) => d.id === active)!;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="프롬프트 단계" className="seg">
          {demos.map((d) => (
            <button
              key={d.id}
              role="tab"
              type="button"
              aria-selected={view === "tabs" && active === d.id}
              onClick={() => {
                setActive(d.id);
                setView("tabs");
              }}
            >
              Level {d.id}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            aria-expanded={showPrompt}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            프롬프트 {showPrompt ? "접기" : "펼치기"}
          </button>
          <button
            type="button"
            onClick={() => setView((v) => (v === "tabs" ? "split" : "tabs"))}
            className="hidden text-muted-foreground underline-offset-4 hover:text-foreground hover:underline xl:block"
          >
            {view === "tabs" ? "세 개 나란히 보기" : "하나씩 보기"}
          </button>
        </div>
      </div>

      {view === "tabs" ? (
        <div role="tabpanel" className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div className="space-y-5">
            <div>
              <h3 className="text-2xl font-bold tracking-[-0.01em] lg:text-[1.75rem]">{current.title}</h3>
              <p className="mt-1.5 text-muted-foreground">{current.summary}</p>
            </div>
            <PromptBox level={current} open={showPrompt} />
            <p className="leading-relaxed">{current.note}</p>
          </div>
          <Result level={current} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-5">
          {demos.map((d) => (
            <div key={d.id} className="min-w-0 space-y-4">
              <div>
                <h3 className="text-lg font-bold">
                  Level {d.id}. {d.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{d.summary}</p>
              </div>
              <PromptBox level={d} open={showPrompt} fixed />
              <Result level={d} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
