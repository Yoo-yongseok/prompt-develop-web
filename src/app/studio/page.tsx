import type { Metadata } from "next";
import { PromptMaker } from "@/components/prompt-maker";

export const metadata: Metadata = { title: "프롬프트 만들기" };

export default function StudioPage() {
  return (
    <div className="wrap pb-[72px] lg:pb-[128px]">
      <header className="pb-12 pt-12 lg:pb-20 lg:pt-20">
        <h1 className="h-page">프롬프트 만들기</h1>
        <p className="lead mt-5">세 단계를 차례로 하면 최종 프롬프트가 완성됩니다.</p>
      </header>
      <PromptMaker />
    </div>
  );
}
