"use client";

import { useState } from "react";
import { annotatedPrompt, elements, type ElementKey } from "@/content/elements";
import { cn } from "@/lib/utils";

/** 요소를 고르면 예시 프롬프트에서 그 요소를 담은 문장에 형광펜이 칠해진다. */
export function ElementExplorer() {
  const [active, setActive] = useState<ElementKey>("why");
  const current = elements.find((e) => e.key === active)!;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      <ul>
        {elements.map((el) => {
          const on = el.key === active;
          return (
            <li key={el.key} className="border-t border-input last:border-b">
              <button
                type="button"
                onClick={() => setActive(el.key)}
                aria-pressed={on}
                className="group flex w-full items-baseline gap-4 py-5 text-left lg:gap-6 lg:py-6"
              >
                <span
                  className={cn(
                    "w-[4.5rem] shrink-0 text-2xl font-bold tracking-[-0.01em] transition-colors duration-150 lg:w-24 lg:text-[1.75rem]",
                    !on && "text-muted-foreground group-hover:text-foreground",
                  )}
                  style={on ? { color: el.color } : undefined}
                >
                  {el.name}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-base lg:text-lg", on ? "font-semibold" : "text-muted-foreground")}>
                    {el.question}
                  </span>
                  {on && <span className="mt-1.5 block leading-relaxed text-muted-foreground">예: {el.example}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="self-start rounded-[24px] bg-card p-6 lg:sticky lg:top-24 lg:p-9">
        <p className="text-sm text-muted-foreground">          <strong className="font-bold" style={{ color: current.color }}>
            {current.name}
          </strong>
          을(를) 담은 문장
        </p>
        <div className="mt-5 space-y-2 text-lg leading-[1.7] lg:text-xl lg:leading-[1.7]" aria-live="polite">
          {annotatedPrompt.map((line) => {
            const hit = line.keys.includes(active);
            return (
              <p key={line.text} className={cn("transition-colors duration-150", !hit && "text-muted-foreground")}>
                <span
                  className="box-decoration-clone px-1 py-0.5"
                  style={hit ? { background: `color-mix(in oklab, ${current.color} 20%, transparent)` } : undefined}
                >
                  {line.text}
                </span>
              </p>
            );
          })}
        </div>        <p className="mt-6 border-t border-input pt-5 text-sm leading-relaxed text-muted-foreground">
          형식은 없습니다. 빠진 것이 없는지 확인하는 기준입니다.
        </p>
      </div>
    </div>
  );
}
