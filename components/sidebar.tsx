"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGlobalHistory } from "@/components/data-context";
import { legacyTools, type LegacyTool } from "@/lib/tools";

const TOOL_ORDER_KEY = "hun.toolOrder";
const TOOL_COLOR_KEY = "hun.toolColors";

const COLOR_PRESETS = [
  { label: "ค่าเริ่มต้น", value: "" },
  { label: "เหลือง", value: "#fef08a" },
  { label: "เขียว", value: "#bbf7d0" },
  { label: "ฟ้า", value: "#bae6fd" },
  { label: "ชมพู", value: "#fda4af" },
  { label: "ม่วง", value: "#d8b4fe" },
  { label: "ส้ม", value: "#fed7aa" },
];

function GlobalHistoryPanel() {
  const { historyText, setHistoryText, saveHistory, clearHistory, lineCount } = useGlobalHistory();

  return (
    <section className="mb-4 rounded-2xl bg-white/90 p-3 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-ink">📊 Data Center (Autofill)</h2>
        {lineCount > 0 && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] text-green-700 font-bold">✓ {lineCount}/250</span>}
      </div>

      <textarea
        value={historyText}
        onChange={(event) => setHistoryText(event.target.value)}
        placeholder="วางผลย้อนหลัง เช่น:&#10;2026-04-01&#9;'123&#9;'45"
        className="mt-2 h-24 w-full rounded-xl border border-ink/15 bg-white p-2 text-xs leading-relaxed text-ink outline-none transition focus:border-pine/60 focus:ring-2 focus:ring-pine/20"
      />

      <div className="mt-2 flex gap-2">
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
  const [order, setOrder] = useState<string[]>(() => legacyTools.map((t) => t.slug));
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [toolColors, setToolColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedColors = localStorage.getItem(TOOL_COLOR_KEY);
    if (savedColors) {
      try { setToolColors(JSON.parse(savedColors)); } catch {}
    }
  }, []);

  function setColor(slug: string, color: string) {
    setToolColors((prev) => {
      const next = { ...prev };
      if (color) next[slug] = color;
      else delete next[slug];
      localStorage.setItem(TOOL_COLOR_KEY, JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    const saved = localStorage.getItem(TOOL_ORDER_KEY);
    if (!saved) return;
    try {
      const parsed: string[] = JSON.parse(saved);
      const validSet = new Set(legacyTools.map((t) => t.slug));
      const currentSlugs = legacyTools.map((t) => t.slug);
      const reordered = [
        ...parsed.filter((s) => validSet.has(s)),
        ...currentSlugs.filter((s) => !parsed.includes(s)),
      ];
      setOrder(reordered);
    } catch {}
  }, []);

  const sortedTools = order
    .map((slug) => legacyTools.find((t) => t.slug === slug))
    .filter(Boolean) as LegacyTool[];

  function saveOrder(next: string[]) {
    localStorage.setItem(TOOL_ORDER_KEY, JSON.stringify(next));
    setOrder(next);
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    saveOrder(next);
  }

  function resetOrder() {
    const defaults = legacyTools.map((t) => t.slug);
    saveOrder(defaults);
  }

  function handleDragStart(idx: number) {
    setDraggingIdx(idx);
  }

  function handleDragEnter(idx: number) {
    if (draggingIdx === null || draggingIdx === idx) return;
    setOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(draggingIdx, 1);
      next.splice(idx, 0, item);
      return next;
    });
    setDraggingIdx(idx);
  }

  function handleDragEnd() {
    setOrder((current) => {
      localStorage.setItem(TOOL_ORDER_KEY, JSON.stringify(current));
      return current;
    });
    setDraggingIdx(null);
  }

  return (
    <aside className="sticky top-0 flex h-screen flex-col w-full border-r border-ink/10 bg-haze/90 p-4 backdrop-blur md:w-80">
      <GlobalHistoryPanel />

      <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">สารบัญเครื่องมือ ({legacyTools.length})</p>
          <div className="flex gap-1">
            {editMode && (
              <button
                onClick={resetOrder}
                className="rounded-lg border border-ink/20 bg-white px-2 py-1 text-[10px] font-semibold text-ink/60 hover:bg-coral/20 transition"
                title="รีเซ็ตกลับค่าเดิม"
              >
                รีเซ็ต
              </button>
            )}
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                editMode
                  ? "bg-ink text-white"
                  : "border border-ink/20 bg-white text-ink/60 hover:bg-gold/25"
              }`}
            >
              {editMode ? "✓ เสร็จ" : "✏️ จัดลำดับ"}
            </button>
          </div>
        </div>
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
          {sortedTools.map((tool, idx) => {
            const active = pathname === `/tool/${tool.slug}`;
            return (
              <li
                key={tool.slug}
                draggable={!editMode}
                onDragStart={() => !editMode && handleDragStart(idx)}
                onDragEnter={() => !editMode && handleDragEnter(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={() => !editMode && handleDragEnd()}
                className={`${!editMode ? "cursor-grab active:cursor-grabbing" : ""} ${draggingIdx === idx ? "opacity-50" : ""}`}
              >
                {editMode ? (
                  <div
                    className="rounded-xl px-3 py-2 text-sm leading-snug text-ink border border-ink/10"
                    style={{ backgroundColor: toolColors[tool.slug] || "rgba(255,255,255,0.8)" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveItem(idx, -1)}
                          disabled={idx === 0}
                          className="flex h-5 w-5 items-center justify-center rounded bg-ink/10 text-[10px] font-bold hover:bg-pine/30 disabled:opacity-20 transition"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveItem(idx, 1)}
                          disabled={idx === sortedTools.length - 1}
                          className="flex h-5 w-5 items-center justify-center rounded bg-ink/10 text-[10px] font-bold hover:bg-pine/30 disabled:opacity-20 transition"
                        >
                          ↓
                        </button>
                      </div>
                      <span className="flex-1 text-xs">{tool.title}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[9px] text-ink/40">สี:</span>
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.value || "default"}
                          title={preset.label}
                          onClick={() => setColor(tool.slug, preset.value)}
                          className={`h-4 w-4 rounded-full border-2 transition hover:scale-110 ${
                            (toolColors[tool.slug] || "") === preset.value
                              ? "border-ink/70 scale-110"
                              : "border-ink/20 hover:border-ink/50"
                          }`}
                          style={{ backgroundColor: preset.value || "#e5e7eb" }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={`/tool/${tool.slug}`}
                    className={`block rounded-xl px-3 py-2.5 text-sm leading-snug transition ${
                      active
                        ? "bg-ink text-white shadow-soft"
                        : toolColors[tool.slug]
                        ? "text-ink hover:opacity-80"
                        : "bg-white/80 text-ink hover:bg-coral/20"
                    }`}
                    style={!active && toolColors[tool.slug] ? { backgroundColor: toolColors[tool.slug] } : undefined}
                  >
                    {tool.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
