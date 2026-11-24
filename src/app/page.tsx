import Link from "next/link";
import { HeroDemo } from "@/components/hero-demo";
import { StickyCta } from "@/components/sticky-cta";
import { makingPurpose, makingSteps } from "@/content/making-of";
import { loadDemos } from "@/lib/demos";

const flow = [
  { href: "/learn", step: "먼저", title: "프롬프트에 담을 다섯 가지를 배웁니다", action: "배우기" },
  { href: "/explore", step: "그다음", title: "만들고 싶은 것을 정합니다", action: "아이디어 찾기" },
  { href: "/studio", step: "그리고", title: "내 프롬프트를 쓰고 AI와 다듬습니다", action: "실험실" },
];

const skills = ["구체적으로 생각하기", "명확하게 설명하기", "직접 확인하기", "고쳐 달라고 말하기"];

export default async function Home() {
  const htmlByLevel = await loadDemos();

  return (
    <>
      <section className="wrap pb-[72px] pt-12 lg:pb-[112px] lg:pt-20">
        <div className="max-w-[1000px]">
          <h1 className="h-hero">
            같은 아이디어,
            <br />
            다른 프롬프트,
            <br className="sm:hidden" /> 다른 결과물.
          </h1>
          <p className="lead mt-6 max-w-[38ch] text-foreground/80 lg:mt-7 lg:text-xl">
            한 줄로 만든 앱과 스물여섯 줄로 만든 앱. 직접 눌러 보세요.
          </p>
          <div id="hero-cta" className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/studio" className="btn-primary">
              내 프롬프트 쓰러 가기
            </Link>
            <Link href="/learn" className="btn-quiet">
              쓰는 법부터 배우기
            </Link>
          </div>
        </div>
        <div className="mt-12 lg:mt-16">
          <HeroDemo htmlByLevel={htmlByLevel} />
        </div>
      </section>

      <section aria-labelledby="vibe" className="bg-card">
        <div className="wrap section grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
          <div>
            <h2 id="vibe" className="h-section">
              코딩을 몰라도 괜찮습니다.
              <br />
              말로 설명해서 만드니까요.
            </h2>            <p className="lead mt-6 max-w-[40ch]">
              이것을 바이브 코딩이라고 합니다. 코드보다 내 생각을 정확히 전하는 능력이 결과를 좌우합니다.
            </p>
          </div>
          <ol className="self-center">
            {skills.map((title, i) => (
              <li key={title} className="flex gap-5 border-t border-input py-6 last:border-b lg:gap-8">
                <span className="w-6 shrink-0 text-xl font-bold tabular-nums text-primary lg:text-2xl">{i + 1}</span>                <h3 className="text-xl font-bold lg:text-2xl">{title}</h3>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="flow" className="wrap section">
        <h2 id="flow" className="h-section">
          2시간 수업의 흐름
        </h2>
        <div className="mt-10 lg:mt-14">
          {flow.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group grid gap-3 border-t border-input py-8 last:border-b lg:grid-cols-[120px_minmax(0,1fr)_auto] lg:items-baseline lg:gap-10 lg:py-10"
            >
              <span className="font-semibold text-muted-foreground">{f.step}</span>
              <span className="text-2xl font-bold leading-snug tracking-[-0.01em] lg:text-[1.75rem]">{f.title}</span><span className="font-semibold text-primary underline-offset-4 group-hover:underline">{f.action}</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="making" aria-labelledby="making-h" className="dark scroll-mt-16 bg-background">
        <div className="wrap section">
          <div className="max-w-[900px]">
            <h2 id="making-h" className="h-section">
              이 웹사이트도 같은 방법으로 만들었습니다
            </h2>            <p className="lead mt-6">
              AI가 알아서 다 만든 것은 아닙니다. 사람이 기획하고, 요청하고, 확인하고, 다시 고쳤습니다.
            </p>
          </div>

          <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20">
            <div>
              <h3 className="text-xl font-bold">만들게 된 목적</h3>
              <p className="mt-3 leading-[1.75] text-muted-foreground">{makingPurpose}</p>
            </div>
            <ol>
              {makingSteps.map((step, i) => (
                <li key={step.title} className="flex gap-5 border-t border-border py-7 last:border-b lg:gap-8">
                  <span className="w-6 shrink-0 text-xl font-bold tabular-nums text-primary">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className={"text-xl font-bold " + (step.status === "done" ? "" : "text-muted-foreground")}>
                        {step.title}
                      </h3>
                      {step.who && <span className="text-sm text-muted-foreground">{step.who}</span>}
                    </div>
                    {step.status === "done" ? (
                      <>
                        <p className="mt-2.5 leading-[1.75] text-foreground/85">{step.body}</p>
                        {step.quote && (
                          <p className="mt-4 rounded-xl bg-card px-5 py-4 text-base">
                            <span className="mb-1 block text-sm text-muted-foreground">실제 요청</span>
                            {step.quote}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        진행 전
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="h-section">
              당신의 생각이
              <br />
              기술이 되는 순간.
            </h2></div>
          <Link href="/studio" className="btn-primary w-full shrink-0 sm:w-auto">
            내 프롬프트 쓰러 가기
          </Link>
        </div>
      </section>

      <StickyCta watch="hero-cta" />
    </>
  );
}
