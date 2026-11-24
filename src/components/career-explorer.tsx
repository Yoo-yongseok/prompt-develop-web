"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clapperboard,
  Coffee,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Leaf,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Shirt,
  Sofa,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { careers, type Career } from "@/content/careers";
import { loadStudio, saveStudio } from "@/lib/storage";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  Dumbbell,
  Gamepad2,
  PawPrint,
  Coffee,
  PiggyBank,
  Shirt,
  Music,
  GraduationCap,
  Sofa,
  Leaf,
  Plane,
  Clapperboard,
};

function Detail({ career, onBring }: { career: Career; onBring: () => void }) {
  const [tab, setTab] = useState<"student" | "improved">("student");

  return (
    <div>
      <p className="font-semibold text-primary">{career.field}</p>
      <h2 className="mt-1 text-[1.75rem] font-bold leading-tight tracking-[-0.015em] lg:text-[2.5rem]">{career.app}</h2>
      <p className="mt-4 max-w-[46ch] text-lg leading-relaxed lg:text-xl lg:leading-relaxed">{career.problem}</p>

      <dl className="mt-8 grid gap-x-10 gap-y-6 border-t border-input pt-7 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">목적</dt>
          <dd className="mt-1.5 leading-relaxed">{career.purpose}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">주요 기능</dt>
          <dd className="mt-1.5 leading-relaxed">
            <ul>
              {career.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">관련 직업</dt>
          <dd className="mt-1.5 leading-relaxed">{career.jobs.join(", ")}</dd>
        </div>
      </dl>

      <div className="mt-9">
        <div role="tablist" aria-label="프롬프트 예시" className="seg sm:inline-flex">
          {(
            [
              ["student", "학생 프롬프트 예시"],
              ["improved", "AI와 발전시킨 예시"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className="flex-1 sm:whitespace-nowrap"
            >
              {label}
            </button>
          ))}
        </div>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-[20px] bg-card p-6 font-sans text-base leading-relaxed">
          {tab === "student" ? career.studentPrompt : career.improvedPrompt}
        </pre>        {tab === "improved" && (
          <p className="mt-3 text-sm text-muted-foreground">‘AI 제안 기본값’은 바꿔도 됩니다.</p>
        )}
      </div>

      <div className="mt-8 border-t border-input pt-7">
        <h3 className="font-bold">          예상 화면 <span className="font-normal text-muted-foreground">실제 결과 아님</span>
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed text-foreground/85">
          {career.expected.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>

      <div className="mt-9 flex flex-col gap-5 rounded-[20px] bg-card p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">        <p className="leading-relaxed">그대로 쓰기보다 내 생각을 더해 보세요.</p>
        <button type="button" onClick={onBring} className="btn-primary shrink-0">
          이 아이디어로 시작하기
        </button>
      </div>
    </div>
  );
}

/** 왼쪽 목록에서 분야를 고르면 오른쪽 내용이 바뀐다. 모바일에서는 목록 아래에 내용이 이어진다. */
export function CareerExplorer() {
  const router = useRouter();
  const [activeId, setActiveId] = useState(careers[0].id);
  const [confirm, setConfirm] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const active = careers.find((c) => c.id === activeId)!;

  function pick(id: string) {
    setActiveId(id);
    setConfirm(false);
    // 모바일에서는 목록이 위에 있으므로 고른 내용이 보이도록 내려 준다.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  function bring(force = false) {
    const current = loadStudio();
    if (!force && (current.original.trim() || current.final.trim())) {
      setConfirm(true);
      return;
    }
    const ok = saveStudio({
      original: active.studentPrompt,
      final: "",
      source: `${active.field}, ${active.app}`,
      savedAt: new Date().toISOString(),
    });
    if (!ok) {
      toast.error("이 브라우저에서는 저장할 수 없어 가져오지 못했습니다. 예시를 직접 복사해 주세요.");
      return;
    }
    router.push("/studio");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
      <div
        role="tablist"
        aria-label="진로 분야"
        className="grid grid-cols-2 gap-x-4 self-start border-t border-input lg:sticky lg:top-24 lg:grid-cols-1"
      >
        {careers.map((c) => {
          const Icon = icons[c.icon];
          const on = c.id === activeId;
          return (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => pick(c.id)}
              className={cn(
                "flex w-full items-center gap-3 border-b border-input px-1 py-3.5 text-left text-base transition-colors duration-150 lg:px-2",
                on ? "font-bold text-primary" : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {c.field}
            </button>
          );
        })}
      </div>

      <div ref={detailRef} role="tabpanel" className="scroll-mt-24">
        {confirm ? (
          <div role="alert" className="rounded-[20px] bg-card p-7">
            <p className="text-lg leading-relaxed">
              실험실에 작성 중인 글이 지워집니다.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn-quiet" onClick={() => setConfirm(false)}>
                유지하기
              </button>
              <button type="button" className="btn-primary" onClick={() => bring(true)}>
                지우고 시작하기
              </button>
            </div>
          </div>
        ) : (
          <Detail key={active.id} career={active} onBring={() => bring()} />
        )}
      </div>
    </div>
  );
}
