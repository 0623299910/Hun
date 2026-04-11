"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGlobalHistory } from "@/components/data-context";
import { legacyTools } from "@/lib/tools";

function GlobalHistoryPanel() {
  const { historyText, setHistoryText, saveHistory, clearHistory, lineCount } = useGlobalHistory();

  return (
    <section className="mb-4 rounded-2xl bg-white/90 p-4 shadow-soft">
      <h2 className="font-display text-sm font-semibold text-ink">📊 Data Center (Autofill)</h2>
      <p className="mt-1 text-xs text-ink/70">
        วางผลย้อนหลังได้สูงสุด 250 บรรทัด แล้วกดบันทึก — ข้อมูลจะถูกส่งไปทุกสูตรอัตโนมัติ
      </p>

      <textarea
        value={historyText}
        onChange={(event) => setHistoryText(event.target.value)}
        placeholder="ตัวอย่าง:&#10;2026-04-01&#9;'123&#9;'45&#10;2026-03-31&#9;'456&#9;'78"
        className="mt-3 h-40 w-full rounded-xl border border-ink/15 bg-white p-3 text-xs leading-relaxed text-ink outline-none transition focus:border-pine/60 focus:ring-2 focus:ring-pine/20"
      />

      <div className="mt-2 flex items-center justify-between text-[11px] text-ink/65">
        <span>ข้อมูล: {lineCount}/250 บรรทัด</span>
        {lineCount > 0 && <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 font-bold">✓ พร้อม</span>}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={saveHistory}
          className="flex-1 rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-pine active:scale-[0.98]"
        >
          💾 บันทึกและส่งทุกสูตร
        </button>
        <button
          onClick={clearHistory}
          className="rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-xs font-semibold text-ink transition hover:bg-coral/20 active:scale-[0.98]"
        >
          🗑️ ล้าง
        </button>
      </div>
    </section>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen flex-col w-full border-r border-ink/10 bg-haze/90 p-4 backdrop-blur md:w-80">
      <div className="mb-4 rounded-2xl bg-white/90 p-4 shadow-soft">
        <h1 className="font-serif text-xl font-bold text-ink">Hun Formula Hub</h1>
        <p className="mt-1 text-sm text-ink/70">รวมสูตรและเครื่องมือจาก HTML เดิมทั้งหมดไว้ในที่เดียว</p>
      </div>

      <GlobalHistoryPanel />

      <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink/55">สารบัญเครื่องมือ ({legacyTools.length})</p>
        <ul className="space-y-1.5">
          <li>
            <Link
              href="/"
              className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                pathname === "/"
                  ? "bg-ink text-white"
                  : "bg-white/80 text-ink hover:bg-gold/25"
              }`}
            >
              🏠 หน้าหลัก
            </Link>
          </li>
          {legacyTools.map((tool) => {
            const active = pathname === `/tool/${tool.slug}`;
            return (
              <li key={tool.slug}>
                <Link
                  href={`/tool/${tool.slug}`}
                  className={`block rounded-xl px-3 py-2.5 text-sm leading-snug transition ${
                    active
                      ? "bg-ink text-white shadow-soft"
                      : "bg-white/80 text-ink hover:bg-coral/20"
                  }`}
                >
                  {tool.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
