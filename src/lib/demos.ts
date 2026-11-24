import { readFile } from "node:fs/promises";
import path from "node:path";
import { levels } from "@/content/levels";

/** Level 1~3 비교용 미니 앱 HTML을 읽는다. 파일이 없으면 null. */
export async function loadDemos() {
  "use cache";
  const entries = await Promise.all(
    levels.map(async (l) => {
      try {
        const html = await readFile(path.join(process.cwd(), "src/content/demos", l.file), "utf8");
        return [l.id, html] as const;
      } catch {
        return [l.id, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Record<number, string | null>;
}
