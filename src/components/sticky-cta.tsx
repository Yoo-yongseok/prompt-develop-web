"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/** 모바일에서 첫 화면의 시작 버튼이 화면 밖으로 나간 뒤 아래에 나타나는 버튼. */
export function StickyCta({ watch }: { watch: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watch);
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => {
      setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(target);
    return () => io.disconnect();
  }, [watch]);

  return (
    <div
      aria-hidden={!show}
      className={
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background p-3 transition-transform duration-300 sm:hidden " +
        (show ? "translate-y-0" : "translate-y-full")
      }
    >
      <Link href="/studio" tabIndex={show ? 0 : -1} className="btn-primary w-full">
        내 프롬프트 쓰러 가기
      </Link>
    </div>
  );
}
