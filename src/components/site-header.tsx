"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menus = [{ href: "/studio", label: "프롬프트 만들기" }];

export function Logo() {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap text-base font-bold tracking-[-0.01em] sm:gap-2.5 sm:text-lg">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="currentColor" />
        <path
          d="M8.5 10l4.5 4-4.5 4M15 18.5h5"
          fill="none"
          stroke="var(--background)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Prompt Lab
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="wrap flex h-[60px] items-center justify-between gap-2 sm:h-[68px] sm:gap-4">
        <Link href="/" aria-label="Prompt Lab 홈" className="rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="주요 메뉴" className="flex items-center sm:gap-2">
          {menus.map((m) => {
            const active = pathname === m.href || pathname.startsWith(m.href + "/");
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative whitespace-nowrap rounded-lg px-2 py-3 text-[15px] font-semibold transition-colors duration-150 sm:px-4 sm:text-base",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 bg-primary sm:inset-x-4" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
