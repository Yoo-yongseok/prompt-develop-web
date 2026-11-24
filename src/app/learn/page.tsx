import type { Metadata } from "next";
import Link from "next/link";
import { ElementExplorer } from "@/components/element-explorer";
import { LevelCompare } from "@/components/level-compare";
import { everydayUses, feedbackPairs } from "@/content/elements";
import { levelSteps } from "@/content/levels";
import { CODEGEN_SYSTEM } from "@/lib/llm/codegen-prompt";
import { loadDemos } from "@/lib/demos";

export const metadata: Metadata = { title: "배우기 — 프롬프트에 담을 다섯 가지" };

export default async function LearnPage() {
  const htmlByLevel = await loadDemos();

  return (
    <>
      <header className="wrap pb-4 pt-12 lg:pt-20">
        <h1 className="h-page max-w-[18ch]">좋은 프롬프트는 길어서가 아니라, 빠진 게 없어서 좋습니다</h1>
        <p className="lead mt-6 max-w-[52ch]">
          다섯 가지만 확인하면 됩니다. 10분이면 충분합니다.
        </p>
      </header>

      <section aria-labelledby="five" className="wrap section">
        <h2 id="five" className="h-section">
          프롬프트에 담을 다섯 가지
        </h2>
        
        <div className="mt-10 lg:mt-14">
          <ElementExplorer />
        </div>
      </section>

      <section aria-labelledby="levels" className="dark scroll-mt-16 bg-background" id="levels-section">
        <div className="wrap section">
          <h2 id="levels" className="h-section">
            같은 아이디어, 세 가지 프롬프트
          </h2>
          <p className="lead mt-5 max-w-[60ch]">
            그림이 아니라 실제로 생성된 앱입니다. 눌러 보세요.
          </p>
          <div className="mt-10 lg:mt-12">
            <LevelCompare htmlByLevel={htmlByLevel} />
          </div>

          <dl className="mt-14 grid gap-10 border-t border-border pt-10 md:grid-cols-2 lg:gap-16">
            {levelSteps.map((s) => (
              <div key={s.from}>
                <dt className="text-xl font-bold lg:text-2xl">
                  Level {s.from}에서 {s.to}로
                </dt>
                <dd className="mt-3 leading-[1.75] text-muted-foreground">{s.lesson}</dd>
              </div>
            ))}
          </dl>

          <details className="mt-10 border-t border-border pt-6">
            <summary className="cursor-pointer text-lg font-semibold marker:text-muted-foreground">
              이 비교는 공정한가요?
            </summary>
            <div className="mt-5 max-w-[80ch] space-y-4 leading-[1.75] text-muted-foreground">              <p>
                실험실과 같은 AI에 아래 지침을 똑같이 주고 각각 따로 만들었습니다. 다른 것은 프롬프트뿐이고, 코드는
                고치지 않았습니다. AI의 결과는 만들 때마다 달라지니 한 번으로 단정하지 마세요.
              </p>
              <pre className="overflow-auto whitespace-pre-wrap rounded-xl bg-card p-5 font-sans text-sm text-foreground/85">
                {CODEGEN_SYSTEM}
              </pre>
            </div>
          </details>
        </div>
      </section>

      <section aria-labelledby="feedback" className="wrap section">
        <h2 id="feedback" className="h-section">
          결과를 본 뒤에도 프롬프트는 계속됩니다
        </h2>        <p className="lead mt-5">무엇을, 어떻게 바꿀지 말해 주세요.</p>
        <div className="mt-10 lg:mt-14">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,5fr)] gap-10 pb-3 text-sm font-semibold text-muted-foreground sm:grid">
            <div>막연한 요청</div>
            <div>구체적인 요청</div>
          </div>
          {feedbackPairs.map((p) => (
            <div
              key={p.vague}
              className="grid gap-2 border-t border-input py-6 last:border-b sm:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] sm:gap-10 lg:py-7"
            >
              <p className="text-lg text-muted-foreground line-through decoration-muted-foreground/60 lg:text-xl">{p.vague}</p>
              <p className="text-lg leading-relaxed lg:text-xl lg:leading-relaxed">{p.specific}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="everyday" className="bg-card">
        <div className="wrap section grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
          <div>
            <h2 id="everyday" className="h-section">
              앱 만들 때만 쓰는 방법이 아닙니다
            </h2>
          </div>
          <ul className="grid grid-cols-2 self-center text-lg font-semibold lg:text-xl">
            {everydayUses.map((u) => (
              <li key={u} className="border-t border-input py-4 lg:py-5">
                {u}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap section">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="h-section">이제 내 아이디어로 써 볼 차례</h2>
            
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/explore" className="btn-quiet">
              아이디어 찾기
            </Link>
            <Link href="/studio" className="btn-primary">
              내 프롬프트 쓰러 가기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
