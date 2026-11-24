"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AI가 생성한 HTML을 격리해서 실행한다.
 * - sandbox에 allow-scripts만 준다. allow-same-origin을 함께 주지 않으므로
 *   부모 페이지, 쿠키, localStorage에 접근할 수 없다.
 * - 팝업, 최상위 페이지 이동, 폼 전송, 모달은 sandbox가 막는다.
 * - CSP로 외부 네트워크 요청을 모두 막는다.
 */
const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "media-src data: blob:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

/**
 * 격리된 iframe에서는 localStorage 접근이 오류를 내고 alert·confirm이 막힌다.
 * 생성된 앱이 이것 때문에 통째로 멈추지 않도록, 메모리에만 저장하는 대체품을 넣는다.
 * 실제 브라우저 저장소에는 아무것도 남지 않는다. 모든 결과물에 똑같이 적용된다.
 */
const SHIM = `<script>(function(){
function mem(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}
["localStorage","sessionStorage"].forEach(function(n){try{Object.defineProperty(window,n,{value:mem(),configurable:true})}catch(e){}});
window.alert=function(){};window.confirm=function(){return true};window.prompt=function(){return null};
})();</script>`;

/** 모델이 코드 블록 표시로 감싸 보낸 경우 HTML만 꺼낸다. */
export function extractHtml(text: string) {
  const fenced = text.match(/```(?:html)?\s*\n([\s\S]*?)(?:\n```|$)/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/<!doctype html|<html[\s>]/i);
  return start > 0 ? body.slice(start) : body;
}

export function withCsp(html: string) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP}">${SHIM}`;
  if (/<head(\s[^>]*)?>/i.test(html)) return html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}${meta}`);
  if (/<html(\s[^>]*)?>/i.test(html)) return html.replace(/<html(\s[^>]*)?>/i, (m) => `${m}<head>${meta}</head>`);
  return `<!doctype html><html><head>${meta}</head><body>${html}</body></html>`;
}

export function SandboxFrame({
  html,
  title,
  className,
}: {
  html: string;
  title: string;
  className?: string;
}) {
  const [run, setRun] = useState(0);
  const doc = useMemo(() => withCsp(html), [html]);

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-[20px] border border-input bg-background", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
        <span className="truncate text-sm text-muted-foreground">{title}</span>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          처음 상태로
        </button>
      </div>
      <iframe
        key={run}
        title={title}
        srcDoc={doc}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        className="min-h-0 w-full flex-1 bg-white"
      />
    </div>
  );
}
