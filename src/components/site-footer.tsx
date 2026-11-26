import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="wrap flex flex-col gap-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Prompt Lab</p>
        <nav aria-label="바닥글 메뉴" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/studio" className="hover:text-foreground">
            프롬프트 만들기
          </Link>
          <Link href="/#making" className="hover:text-foreground">
            만든 과정
          </Link>
        </nav>
      </div>
    </footer>
  );
}
