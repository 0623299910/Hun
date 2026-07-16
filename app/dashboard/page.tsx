"use client";
import { useState } from "react";
import Link from "next/link";
import Tool016Overview from "@/components/tools/tool-016-overview";
import Tool022LuckMeter from "@/components/tools/tool-022-luck-meter";
import Tool001HundredsCut from "@/components/tools/tool-001-hundreds-cut";
import Tool002LowProbability from "@/components/tools/tool-002-low-probability";
import Tool003AllInOne from "@/components/tools/tool-003-all-in-one";
import ToolSimulator from "@/components/tools/tool-simulator";

const DASHBOARD_TOOLS = [
  { id: 1, title: "ภาพรวม", component: Tool016Overview },
  { id: 2, title: "ตัดร้อย", component: Tool001HundredsCut },
  { id: 3, title: "ความน่าจะน้อย", component: Tool002LowProbability },
  { id: 4, title: "All-in-One", component: Tool003AllInOne },
  { id: 5, title: "ดวงวันนี้", component: Tool022LuckMeter },
  { id: 6, title: "ผลหุ้นสด", component: ToolSimulator },
];

export default function DashboardPage() {
  const [gridLayout, setGridLayout] = useState<"2x3" | "3x2" | "1col">("2x3");
  const [selectedTools, setSelectedTools] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const toggleTool = (id: number) => {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id].sort()
    );
  };

  const visibleTools = DASHBOARD_TOOLS.filter((t) => selectedTools.includes(t.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
            📊 Dashboard - รวมทุกเครื่องมือ
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            ดูและวิเคราะห์ข้อมูลทั้งหมดในหน้าเดียว
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Layout Switcher */}
          <div className="flex gap-1 rounded-lg border border-ink/10 bg-haze p-1">
            <button
              onClick={() => setGridLayout("2x3")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition ${
                gridLayout === "2x3"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink/50 hover:text-ink"
              }`}
              title="แสดง 2 คอลัมน์"
            >
              2×3
            </button>
            <button
              onClick={() => setGridLayout("3x2")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition ${
                gridLayout === "3x2"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink/50 hover:text-ink"
              }`}
              title="แสดง 3 คอลัมน์"
            >
              3×2
            </button>
            <button
              onClick={() => setGridLayout("1col")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition ${
                gridLayout === "1col"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink/50 hover:text-ink"
              }`}
              title="แสดง 1 คอลัมน์"
            >
              1 คอลัมน์
            </button>
          </div>

          <Link
            href="/"
            className="rounded-full border border-ink/20 bg-haze px-4 py-2 text-sm text-ink transition hover:bg-gold/35"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>

      {/* Tool Selector */}
      <div className="rounded-2xl border border-ink/10 bg-white p-4">
        <h3 className="mb-2 text-sm font-bold text-ink/70">เลือกเครื่องมือที่ต้องการแสดง:</h3>
        <div className="flex flex-wrap gap-2">
          {DASHBOARD_TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => toggleTool(tool.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                selectedTools.includes(tool.id)
                  ? "bg-pine text-white shadow-sm"
                  : "border border-ink/20 bg-haze text-ink/50 hover:bg-ink/5"
              }`}
            >
              {tool.id}. {tool.title}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div
        className={`grid gap-4 ${
          gridLayout === "2x3"
            ? "grid-cols-1 lg:grid-cols-2"
            : gridLayout === "3x2"
            ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {visibleTools.map((tool) => {
          const Component = tool.component;
          return (
            <div
              key={tool.id}
              className="rounded-2xl border border-ink/10 bg-gradient-to-br from-white to-haze/30 p-4 shadow-soft"
            >
              <div className="mb-3 flex items-center justify-between border-b border-ink/10 pb-2">
                <h3 className="font-display text-lg font-bold text-ink">
                  {tool.id}. {tool.title}
                </h3>
                <button
                  onClick={() => toggleTool(tool.id)}
                  className="rounded-full p-1 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
                  title="ซ่อน"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
                <Component />
              </div>
            </div>
          );
        })}
      </div>

      {visibleTools.length === 0 && (
        <div className="rounded-2xl border border-ink/10 bg-white p-12 text-center">
          <p className="text-lg text-ink/50">
            กรุณาเลือกเครื่องมืออย่างน้อย 1 รายการ
          </p>
        </div>
      )}
    </div>
  );
}
