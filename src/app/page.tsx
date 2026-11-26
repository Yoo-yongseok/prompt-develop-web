import Link from "next/link";
import { makingPurpose, makingSteps } from "@/content/making-of";

/** 오늘 수업에서 하는 세 단계. /studio의 단계와 같은 순서다. */
const steps = [
  {
    title: "문제 찾기",
    body: "관심 있는 진로 분야를 고르고, 그 분야에서 앱으로 해결할 문제를 정합니다. 떠올리기 어려우면 분야별 예시에서 고를 수 있습니다.",
  },
  {
    title: "기능 정하기",
    body: "누가 쓰는 앱인지, 어떤 문제를 푸는지 AI에게 설명합니다. AI가 제안한 기능 중에서 쓸 것을 직접 고릅니다.",
  },
  {
    title: "화면 순서 정하기",
    body: "사용자가 앱을 쓰는 순서를 적으면, AI가 고른 기능과 합쳐 최종 프롬프트로 정리해 줍니다.",
  },
];

/** 첫 화면에 보여 주는 진행 예시. 실제 학생의 글이 아니라 설명을 위해 만든 것이다. */
const example = {
  problem: "용돈이 어디에 쓰였는지 몰라서 월말이면 항상 모자란다.",
  features: ["쓴 돈 기록하기", "분류별로 얼마 썼는지 보기", "남은 용돈 보여 주기"],
  flow: ["앱을 열면 남은 용돈이 보인다", "기록하기를 누르고 금액과 분류를 넣는다", "저장하면 목록과 합계가 바뀐다"],
};

export default function Home() {
  return (
    <>
      <section className="wrap grid gap-12 pb-[72px] pt-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center lg:gap-16 lg:pb-[120px] lg:pt-24">
        <div>
          <h1 className="h-hero">
            내가 풀고 싶은 문제를,
            <br />
            AI가 알아듣는 말로.
          </h1>
          <p className="lead mt-6 max-w-[30ch] text-foreground/85 lg:mt-8">
            오늘 세 단계로 프롬프트를 완성하고, 다음 시간에 캔바에서 앱으로 만듭니다.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/studio" className="btn-primary">
              시작하기
            </Link>
            <Link href="#steps" className="btn-quiet">
              오늘 할 일 보기
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] bg-card p-6 lg:p-9">
          <p className="text-sm font-semibold text-muted-foreground">이렇게 진행됩니다 (예시)</p>
          <dl className="mt-5 space-y-6">
            <div>
              <dt className="text-sm font-bold text-sky">1. 찾은 문제</dt>
              <dd className="mt-1.5 text-lg leading-[1.55]">{example.problem}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-sky">2. 고른 기능</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {example.features.map((f) => (
                  <span key={f} className="rounded-lg bg-primary px-3 py-1.5 font-semibold">
                    {f}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-sky">3. 적은 화면 순서</dt>
              <dd className="mt-1.5">
                <ol className="list-decimal space-y-1 pl-5 leading-[1.55]">
                  {example.flow.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ol>
              </dd>
            </div>
          </dl>
          <p className="mt-6 border-t border-input pt-5 font-semibold">
            이 셋이 합쳐져 캔바에 넣을 최종 프롬프트가 됩니다.
          </p>
        </div>
      </section>

      <section id="steps" aria-labelledby="steps-h" className="scroll-mt-16 bg-card">
        <div className="wrap section">
          <h2 id="steps-h" className="h-section">
            오늘 할 일은 세 가지입니다
          </h2>
          <ol className="mt-10 lg:mt-14">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="grid gap-3 border-t border-input py-8 last:border-b lg:grid-cols-[80px_minmax(0,4fr)_minmax(0,7fr)] lg:items-baseline lg:gap-10 lg:py-10"
              >
                <span className="grid size-12 place-items-center rounded-full bg-primary text-xl font-bold" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="text-2xl font-bold tracking-[-0.015em] lg:text-[2rem]">{s.title}</h3>
                <p className="leading-[1.7] text-muted-foreground lg:text-lg">{s.body}</p>
              </li>
            ))}
          </ol>
          <Link href="/studio" className="btn-primary mt-10 w-full sm:w-auto">
            시작하기
          </Link>
        </div>
      </section>

      <section id="making" aria-labelledby="making-h" className="dark scroll-mt-16 bg-background">
        <div className="wrap section">
          <div className="max-w-[900px]">
            <h2 id="making-h" className="h-section">
              이 웹사이트도 같은 방법으로 만들었습니다
            </h2>
            <p className="lead mt-6">
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
                  <span className="w-6 shrink-0 text-xl font-bold tabular-nums text-sky">{i + 1}</span>
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
                          <p className="mt-4 rounded-xl bg-card px-5 py-4">
                            <span className="mb-1 block text-sm text-muted-foreground">실제 요청</span>
                            {step.quote}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-1.5 text-sm text-muted-foreground">진행 전</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
