import type { Metadata } from "next";
import Link from "next/link";
import { CareerExplorer } from "@/components/career-explorer";
import { noCareerYet } from "@/content/careers";

export const metadata: Metadata = { title: "아이디어 찾기 — 진로별 앱 아이디어" };

export default function ExplorePage() {
  return (
    <>
      <header className="wrap pb-10 pt-12 lg:pb-16 lg:pt-20">
        <h1 className="h-page max-w-[16ch]">관심 있는 분야에서 만들 것을 찾아보세요</h1>
        <p className="lead mt-6 max-w-[50ch]">
          열두 분야 중에서 골라 보세요.
        </p>
      </header>

      <div className="wrap pb-[72px] lg:pb-[128px]">
        <CareerExplorer />
      </div>

      <section className="bg-card">
        <div className="wrap section grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
          <div>
            <h2 className="h-section">아직 되고 싶은 직업이 없어도 괜찮아요</h2>
            <p className="lead mt-5 max-w-[42ch]">
              이 셋 중 하나에서 시작해도 됩니다.
            </p>
            <Link href="/studio" className="btn-primary mt-8 w-full sm:w-auto">
              내 아이디어로 바로 쓰기
            </Link>
          </div>
          <ul className="self-center text-xl font-semibold lg:text-2xl">
            {noCareerYet.map((t) => (
              <li key={t} className="border-t border-input py-5 last:border-b lg:py-6">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
