import type { Metadata } from "next";
import { StudioWorkbench } from "@/components/studio-workbench";

export const metadata: Metadata = { title: "실험실 — 내 프롬프트 쓰고 다듬기" };

export default function StudioPage() {
  return (
    <div className="wrap pb-[72px] lg:pb-[128px]">
      <header className="pb-10 pt-12 lg:pb-16 lg:pt-20">
        <h1 className="h-page">
          프롬프트 실험실
        </h1>
        <p className="lead mt-6 max-w-[52ch]">
          쓰고, 다듬고, 저장합니다.
        </p>
      </header>
      <StudioWorkbench />
    </div>
  );
}
