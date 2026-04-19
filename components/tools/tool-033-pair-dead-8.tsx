"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";
import { FORMULAS_16 as FORMULAS } from "./shared-formulas-16";

/* ═══════════════════════════════════════════════════════════════
   33. คู่ดับ 8 คู่ — ใช้สูตรจาก shared-formulas-16
   ═══════════════════════════════════════════════════════════════ */

/* ── 8 คู่: { f1Idx, f2Idx } อ้างอิง index ใน FORMULAS ── */
const PAIRS = [
  { pairNo: 1, f1: 0, f2: 1 },
  { pairNo: 2, f1: 2, f2: 3 },
  { pairNo: 3, f1: 4, f2: 5 },
  { pairNo: 4, f1: 6, f2: 7 },
  { pairNo: 5, f1: 8, f2: 9 },
  { pairNo: 6, f1: 10, f2: 11 },
  { pairNo: 7, f1: 12, f2: 13 },
  { pairNo: 8, f1: 14, f2: 15 },
];

/* ── types ── */
interface PairResult {
  pairNo: number;
  f1Name: string;
  f2Name: string;
  d1: number;
  d2: number;
  pass: number;
  total: number;
  pct: number;
}
interface HistoryPair {
  d1: number;
  d2: number;
  ok1: boolean; // d1 ไม่ปรากฏในล่าง
  ok2: boolean; // d2 ไม่ปรากฏในล่าง
  pairPass: boolean; // ผ่าน = ผิด 1-2 ตัว, หรือเบิ้ล
}
interface HistoryRow {
  date: string;
  bottom: string;
  bt: number;
  bu: number;
  pairs: HistoryPair[];
  passCount: number; // คู่ที่ผ่าน
}
interface ComputeResult {
  pairs: PairResult[];
  history: HistoryRow[];
  allPairsText: string;
  avgPct: number;
}

/* ── core compute ── */
function compute(data: ParsedEntry[]): ComputeResult | null {
  if (data.length < 5) return null;
  const n = data.length;

  const pairs: PairResult[] = PAIRS.map(({ pairNo, f1, f2 }) => {
    const d1 = FORMULAS[f1].fn(data, n - 1);
    const d2 = FORMULAS[f2].fn(data, n - 1);

    let pass = 0;
    let total = 0;
    for (let i = 1; i < n - 1; i++) {
      const v1 = FORMULAS[f1].fn(data, i);
      const v2 = FORMULAS[f2].fn(data, i);
      const nextB = data[i + 1].bottom;
      const bt = d(nextB, 0);
      const bu = d(nextB, 1);
      total++;
      // ผ่าน = มีกล่องเขียวอย่างน้อย 1 ใบ (ok1 หรือ ok2) หรือเบิ้ล (v1===v2)
      // ไม่ผ่าน = แดงทั้งสองตัว (!ok1 && !ok2) และ v1 ≠ v2
      const ok1 = v1 !== bt && v1 !== bu;
      const ok2 = v2 !== bt && v2 !== bu;
      const isDouble = v1 === v2;
      if (isDouble || ok1 || ok2) pass++;
    }

    return {
      pairNo,
      f1Name: FORMULAS[f1].name,
      f2Name: FORMULAS[f2].name,
      d1,
      d2,
      pass,
      total,
      pct: total > 0 ? (pass / total) * 100 : 0,
    };
  });

  /* history – last 30 draws */
  const histLen = Math.min(30, n - 2);
  const history: HistoryRow[] = [];
  for (let i = n - 2; i >= Math.max(1, n - 1 - histLen); i--) {
    const nextB = data[i + 1].bottom;
    const bt = d(nextB, 0);
    const bu = d(nextB, 1);

    const histPairs: HistoryPair[] = PAIRS.map(({ f1, f2 }) => {
      const v1 = FORMULAS[f1].fn(data, i);
      const v2 = FORMULAS[f2].fn(data, i);
      const ok1 = v1 !== bt && v1 !== bu;
      const ok2 = v2 !== bt && v2 !== bu;
      const isDouble = v1 === v2;
      const pairPass = isDouble || ok1 || ok2;
      return { d1: v1, d2: v2, ok1, ok2, pairPass };
    });

    history.push({
      date: data[i + 1].date,
      bottom: data[i + 1].bottom,
      bt,
      bu,
      pairs: histPairs,
      passCount: histPairs.filter((p) => p.pairPass).length,
    });
  }

  const allPairsText = pairs
    .map((p) => `คู่${p.pairNo}:[${p.d1}${p.d2}]`)
    .join("  ");
  const avgPct = pairs.reduce((s, p) => s + p.pct, 0) / pairs.length;

  return { pairs, history, allPairsText, avgPct };
}

/* ── color helper ── */
function tierColor(pct: number) {
  if (pct >= 75)
    return {
      text: "text-emerald-600",
      bg: "bg-emerald-500",
      border: "border-emerald-300",
      badge: "bg-emerald-100 text-emerald-700",
      from: "from-emerald-50",
      ring: "ring-emerald-400",
    };
  if (pct >= 65)
    return {
      text: "text-blue-600",
      bg: "bg-blue-500",
      border: "border-blue-300",
      badge: "bg-blue-100 text-blue-700",
      from: "from-blue-50",
      ring: "ring-blue-400",
    };
  if (pct >= 55)
    return {
      text: "text-amber-600",
      bg: "bg-amber-500",
      border: "border-amber-300",
      badge: "bg-amber-100 text-amber-700",
      from: "from-amber-50",
      ring: "ring-amber-400",
    };
  return {
    text: "text-red-500",
    bg: "bg-red-500",
    border: "border-red-300",
    badge: "bg-red-100 text-red-700",
    from: "from-red-50",
    ring: "ring-red-400",
  };
}

/* ── inner component ── */
function Results({
  result,
  showToast,
}: {
  result: ComputeResult;
  showToast: (msg: string) => void;
}) {
  const sorted = useMemo(
    () => [...result.pairs].sort((a, b) => b.pct - a.pct),
    [result.pairs]
  );

  return (
    <div className="animate-[fadeIn_0.5s] space-y-5">

      {/* ─── Summary Banner ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white shadow-lg">
        <div className="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
          🔮 คู่ดับ 8 คู่ — จากสูตรดับตัวเดียว 16 สูตร
        </div>
        <div className="text-[11px] opacity-70 mb-3">
          จับคู่สูตร 1+2, 3+4, 5+6 … 15+16 → 8 คู่ดับ 2 ตัวล่าง
        </div>
        <div className="flex flex-wrap gap-2">
          {result.pairs.map((p) => {
            const c = tierColor(p.pct);
            return (
              <div
                key={p.pairNo}
                className={`flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm`}
              >
                <span className="text-[10px] opacity-70">คู่{p.pairNo}</span>
                <span className="text-xl font-black tracking-widest">
                  {p.d1}{p.d2}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[11px] opacity-70">
          ความแม่นเฉลี่ย {result.avgPct.toFixed(1)}% &nbsp;|&nbsp;
          ย้อนหลัง {result.pairs[0]?.total || 0} งวด
        </div>
      </div>

      {/* ─── 8 Pair Cards ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {result.pairs.map((p) => {
          const c = tierColor(p.pct);
          return (
            <div
              key={p.pairNo}
              className={`relative overflow-hidden rounded-xl border-2 ${c.border} bg-gradient-to-br ${c.from} to-white p-3 shadow-sm transition hover:shadow-md`}
            >
              {/* Badge */}
              <div
                className={`absolute -top-0.5 -left-0.5 rounded-br-lg ${c.badge} px-2 py-0.5 text-[10px] font-bold`}
              >
                คู่ {p.pairNo}
              </div>

              {/* Two dead digits */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ring-2 ${c.ring} bg-white text-4xl font-black ${c.text} shadow`}
                >
                  {p.d1}
                </span>
                <span className="text-xl font-bold text-ink/30">—</span>
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ring-2 ${c.ring} bg-white text-4xl font-black ${c.text} shadow`}
                >
                  {p.d2}
                </span>
              </div>

              {/* Formula names */}
              <div className="mt-2 text-center text-[9px] leading-tight text-ink/40">
                #{(p.pairNo - 1) * 2 + 1} {p.f1Name}
                <br />
                #{(p.pairNo - 1) * 2 + 2} {p.f2Name}
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200/60">
                <div
                  className={`h-full rounded-full ${c.bg} transition-all duration-500`}
                  style={{ width: `${Math.min(p.pct, 100)}%` }}
                />
              </div>

              {/* Pass rate */}
              <div className={`mt-1 text-right text-[11px] font-bold ${c.text}`}>
                {p.pct.toFixed(1)}%
                <span className="ml-1 text-[9px] font-normal text-ink/40">
                  ({p.pass}/{p.total})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Copy All ─── */}
      <button
        onClick={() => {
          copyText(result.allPairsText);
          showToast("คัดลอก: " + result.allPairsText);
        }}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-center font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
      >
        📋 คัดลอกคู่ดับทั้ง 8 คู่
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
                <th className="px-3 py-2 text-left">คู่ / สูตร</th>
                <th className="px-3 py-2 text-center">คู่ดับ</th>
                <th className="px-3 py-2 text-right">ถูก/รวม</th>
                <th className="px-3 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, rank) => {
                const c = tierColor(p.pct);
                return (
                  <tr
                    key={p.pairNo}
                    className="border-t border-ink/5 hover:bg-gray-50/50"
                  >
                    <td className="px-3 py-2 font-bold text-ink/40">
                      {rank + 1}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-ink/80">
                        คู่ {p.pairNo}
                      </span>
                      <div className="text-[9px] text-ink/40">
                        #{(p.pairNo - 1) * 2 + 1} {p.f1Name} &amp; #{(p.pairNo - 1) * 2 + 2} {p.f2Name}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 ${c.badge} text-base font-black tracking-widest`}
                      >
                        {p.d1}{p.d2}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-ink/50">
                      {p.pass}/{p.total}
                    </td>
                    <td className={`px-3 py-2 text-right font-bold ${c.text}`}>
                      {p.pct.toFixed(1)}%
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
                <th className="whitespace-nowrap px-2 py-2 text-left">วันที่</th>
                <th className="px-2 py-2 text-center">ล่าง</th>
                <th className="px-2 py-2 text-center">ถูก</th>
                <th className="px-2 py-2 text-left" colSpan={8}>
                  คู่ 1→8 (เขียว=ไม่ปรากฏ แดง=ปรากฏ | เข้า=ถูกแค่ตัวเดียว)
                </th>
              </tr>
            </thead>
            <tbody>
              {result.history.map((h) => (
                <tr key={h.date} className="border-t border-ink/5 hover:bg-gray-50/40">
                  <td className="whitespace-nowrap px-2 py-1.5 text-ink/60">
                    {h.date}
                  </td>
                  <td className="px-2 py-1.5 text-center font-bold text-ink/80">
                    {h.bottom}
                  </td>
                  <td className="px-2 py-1.5 text-center font-bold text-emerald-600">
                    {h.passCount}/8
                  </td>
                  <td className="px-2 py-1.5" colSpan={8}>
                    <div className="flex flex-wrap gap-[5px]">
                      {h.pairs.map((hp, pi) => (
                        <div key={pi} className="flex items-center gap-[2px]">
                          {/* digit 1 */}
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${
                              hp.ok1
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-600"
                            }`}
                            title={`คู่${pi + 1} สูตร${pi * 2 + 1}: ${hp.d1} ${hp.ok1 ? "✓" : "✗"}`}
                          >
                            {hp.d1}
                          </span>
                          {/* digit 2 */}
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${
                              hp.ok2
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-600"
                            }`}
                            title={`คู่${pi + 1} สูตร${pi * 2 + 2}: ${hp.d2} ${hp.ok2 ? "✓" : "✗"} | คู่นี้${hp.pairPass ? "✓ ผ่าน" : "✗ ไม่ผ่าน"}`}
                          >
                            {hp.d2}
                          </span>
                          {/* คั่นระหว่างคู่ + ✓ เขียวถ้าผ่าน */}
                          <span
                            className={`mx-0.5 text-[8px] ${
                              hp.pairPass ? "text-emerald-500 font-bold" : "text-ink/20"
                            }`}
                          >
                            {hp.pairPass ? "✓" : (pi < 7 ? "│" : "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* ─── main export ─── */
export default function Tool033PairDead8() {
  return (
    <ToolShell title="คู่ดับ 8 คู่ (จาก 16 สูตรดับตัวเดียว)" minEntries={5}>
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
