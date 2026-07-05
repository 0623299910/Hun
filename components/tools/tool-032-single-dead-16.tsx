"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";
import { FORMULAS_16 as FORMULAS } from "./shared-formulas-16";

/* ═══════════════════════════════════════════════════════════════
   32. รวมสูตรดับตัวเดียว 16 สูตร — ใช้สูตรจาก shared-formulas-16
   ═══════════════════════════════════════════════════════════════ */

/* ─── types ─── */
interface ComputedFormula {
  idx: number;
  name: string;
  desc: string;
  dead: number;
  pass: number;
  total: number;
  pct: number;
}
interface HistoryRow {
  date: string;
  bottom: string;
  preds: number[];
  passCount: number;
}
interface ComputeResult {
  formulas: ComputedFormula[];
  allDeadText: string;
  consensus: { digit: number; count: number }[];
  history: HistoryRow[];
  avgPct: number;
}

/* ─── core compute ─── */
function compute(data: ParsedEntry[]): ComputeResult | null {
  if (data.length < 5) return null;
  const n = data.length;

  const formulas: ComputedFormula[] = FORMULAS.map((f, idx) => {
    const dead = f.fn(data, n - 1);
    let pass = 0;
    let total = 0;

    for (let i = 1; i < n - 1; i++) {
      const predicted = f.fn(data, i);
      const nextB = data[i + 1].bottom;
      const bt = d(nextB, 0);
      const bu = d(nextB, 1);
      total++;
      if (predicted !== bt && predicted !== bu) pass++;
    }

    return {
      idx: idx + 1,
      name: f.name,
      desc: f.desc,
      dead,
      pass,
      total,
      pct: total > 0 ? (pass / total) * 100 : 0,
    };
  });

  /* consensus */
  const digitCount = Array(10).fill(0) as number[];
  formulas.forEach((r) => digitCount[r.dead]++);
  const consensus = digitCount
    .map((count, digit) => ({ digit, count }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  /* history – last 15 draws */
  const histLen = Math.min(15, n - 2);
  const history: HistoryRow[] = [];
  for (let i = n - 2; i >= Math.max(1, n - 1 - histLen); i--) {
    const preds = FORMULAS.map((f) => f.fn(data, i));
    const nextB = data[i + 1].bottom;
    const bt = d(nextB, 0);
    const bu = d(nextB, 1);
    let passCount = 0;
    preds.forEach((p) => {
      if (p !== bt && p !== bu) passCount++;
    });
    history.push({
      date: data[i + 1].date,
      bottom: data[i + 1].bottom,
      preds,
      passCount,
    });
  }

  const allDeadText = formulas.map((r) => r.dead).join(" ");
  const avgPct =
    formulas.reduce((s, f) => s + f.pct, 0) / formulas.length;

  return { formulas, allDeadText, consensus, history, avgPct };
}

/* ─── color helpers ─── */
function tierColor(pct: number) {
  if (pct >= 86)
    return {
      text: "text-emerald-600",
      bg: "bg-emerald-500",
      border: "border-emerald-300",
      badge: "bg-emerald-100 text-emerald-700",
      from: "from-emerald-50",
    };
  if (pct >= 82)
    return {
      text: "text-blue-600",
      bg: "bg-blue-500",
      border: "border-blue-300",
      badge: "bg-blue-100 text-blue-700",
      from: "from-blue-50",
    };
  if (pct >= 78)
    return {
      text: "text-amber-600",
      bg: "bg-amber-500",
      border: "border-amber-300",
      badge: "bg-amber-100 text-amber-700",
      from: "from-amber-50",
    };
  return {
    text: "text-red-500",
    bg: "bg-red-500",
    border: "border-red-300",
    badge: "bg-red-100 text-red-700",
    from: "from-red-50",
  };
}

/* ─── inner component (may use hooks) ─── */
function Results({
  result,
  showToast,
}: {
  result: ComputeResult;
  showToast: (msg: string) => void;
}) {
  const sorted = useMemo(
    () => [...result.formulas].sort((a, b) => b.pct - a.pct),
    [result.formulas]
  );

  return (
    <div className="animate-[fadeIn_0.5s] space-y-5">
      {/* ─── Consensus ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white shadow-lg">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider opacity-80">
          🎯 ฉันทามติ — เลขดับที่หลายสูตรเห็นตรงกัน
        </div>
        <div className="flex flex-wrap gap-3">
          {result.consensus.map((c) => (
            <div key={c.digit} className="flex items-center gap-1.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl font-black backdrop-blur-sm">
                {c.digit}
              </span>
              <span className="text-sm font-bold opacity-90">
                ×{c.count} สูตร
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] opacity-70">
          ความแม่นเฉลี่ยรวม {result.avgPct.toFixed(1)}% &nbsp;|&nbsp;
          ข้อมูลย้อนหลัง {result.formulas[0]?.total || 0} งวด
        </div>
      </div>

      {/* ─── 16 Formula Cards ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {result.formulas.map((f) => {
          const c = tierColor(f.pct);
          return (
            <div
              key={f.idx}
              className={`relative overflow-hidden rounded-xl border-2 ${c.border} bg-gradient-to-br ${c.from} to-white p-3 shadow-sm transition hover:shadow-md`}
            >
              {/* Badge */}
              <div
                className={`absolute -top-0.5 -left-0.5 rounded-br-lg ${c.badge} px-2 py-0.5 text-[10px] font-bold`}
              >
                #{f.idx}
              </div>

              {/* Name */}
              <div className="mt-3 text-[11px] font-bold leading-tight text-ink/70">
                {f.name}
              </div>

              {/* Dead digit */}
              <div className={`my-2 text-center text-5xl font-black ${c.text}`}>
                {f.dead}
              </div>

              {/* Desc */}
              <div className="text-[9px] leading-tight text-ink/40">
                {f.desc}
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200/60">
                <div
                  className={`h-full rounded-full ${c.bg} transition-all duration-500`}
                  style={{ width: `${Math.min(f.pct, 100)}%` }}
                />
              </div>

              {/* Pass rate */}
              <div
                className={`mt-1 text-right text-xs font-bold ${c.text}`}
              >
                {f.pct.toFixed(1)}%
                <span className="ml-1 text-[10px] font-normal text-ink/40">
                  ({f.pass}/{f.total})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Copy ─── */}
      <button
        onClick={() => {
          copyText(result.allDeadText);
          showToast("คัดลอก: " + result.allDeadText);
        }}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-center font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
      >
        📋 คัดลอกเลขดับทั้ง 16 สูตร
      </button>

      {/* ─── Ranking Table ─── */}
      <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-4 py-3">
          <h3 className="text-sm font-bold text-ink/70">
            📊 อันดับความแม่นยำ (จากมากไปน้อย)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="px-3 py-2 text-left">อันดับ</th>
                <th className="px-3 py-2 text-left">สูตร</th>
                <th className="px-3 py-2 text-center">ดับ</th>
                <th className="px-3 py-2 text-right">ถูก/รวม</th>
                <th className="px-3 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f, rank) => {
                const c = tierColor(f.pct);
                return (
                  <tr
                    key={f.idx}
                    className="border-t border-ink/5 hover:bg-gray-50/50"
                  >
                    <td className="px-3 py-2 font-bold text-ink/40">
                      {rank + 1}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-ink/80">
                        #{f.idx} {f.name}
                      </span>
                      <div className="text-[9px] text-ink/40">{f.desc}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${c.badge} text-sm font-black`}
                      >
                        {f.dead}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-ink/50">
                      {f.pass}/{f.total}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-bold ${c.text}`}
                    >
                      {f.pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Backtest History ─── */}
      <details className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-ink/70 hover:bg-gray-50">
          📅 ผลย้อนหลังรายงวด ({result.history.length} งวดล่าสุด)
        </summary>
        <div className="overflow-x-auto border-t border-ink/10">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="whitespace-nowrap px-2 py-2 text-left">
                  วันที่
                </th>
                <th className="px-2 py-2 text-center">ล่าง</th>
                <th className="px-2 py-2 text-center">ถูก</th>
                <th className="px-2 py-2 text-left">
                  สูตร 1→16 (เขียว=ถูก แดง=พลาด)
                </th>
              </tr>
              <tr className="bg-gray-100/70 border-b border-ink/10">
                <th colSpan={3} />
                <th className="px-2 py-1 text-left font-normal">
                  <div className="flex flex-wrap gap-[3px]">
                    {FORMULAS.map((f, fi) => (
                      <span
                        key={fi}
                        title={`#${fi + 1} ${f.name}: ${f.desc}`}
                        className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded bg-gray-200 text-[9px] font-bold text-ink/60 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                      >
                        {fi + 1}
                      </span>
                    ))}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {result.history.map((h) => {
                const bt = parseInt(h.bottom[0]);
                const bu = parseInt(h.bottom[1]);
                return (
                  <tr
                    key={h.date}
                    className="border-t border-ink/5"
                  >
                    <td className="whitespace-nowrap px-2 py-1.5 text-ink/60">
                      {h.date}
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold text-ink/80">
                      {h.bottom}
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold text-emerald-600">
                      {h.passCount}/16
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap gap-[3px]">
                        {h.preds.map((p, fi) => {
                          const ok = p !== bt && p !== bu;
                          return (
                            <span
                              key={fi}
                              className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${
                                ok
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-600"
                              }`}
                              title={`สูตร ${fi + 1}: ดับ ${p} ${ok ? "✓ ถูก" : "✗ พลาด"}`}
                            >
                              {p}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* ─── main export ─── */
export default function Tool032SingleDead16() {
  return (
    <ToolShell title="รวมสูตรดับตัวเดียว 16 สูตร" minEntries={5}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-5">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && <Results result={result} showToast={showToast} />}
          </div>
        );
      }}
    </ToolShell>
  );
}
