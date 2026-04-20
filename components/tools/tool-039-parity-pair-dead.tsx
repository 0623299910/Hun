"use client";
import { useState, useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  39. ดับล่าง คู่-คี่
  3 หมวด × 5 สูตร = 15 สูตร
    หมวด 1: คู่+คู่  (สิบ=คู่, หน่วย=คู่)  → เลขคู่ {0,2,4,6,8}
    หมวด 2: คี่+คี่  (สิบ=คี่, หน่วย=คี่)  → เลขคี่ {1,3,5,7,9}
    หมวด 3: คู่+คี่  (สิบ=คู่,หน่วย=คี่ หรือกลับกัน)
  ผ่าน = เลขล่างจริง ≠ คู่ดับ
*/

/* ═══════ parity helpers ═══════ */
/** map raw → even digit {0,2,4,6,8} */
const toEven = (v: number): number => ((((v % 10) + 10) % 10) % 5) * 2;
/** map raw → odd digit {1,3,5,7,9} */
const toOdd = (v: number): number => ((((v % 10) + 10) % 10) % 5) * 2 + 1;

/* ═══════ formula type ═══════ */
type Fn = (data: ParsedEntry[], idx: number) => number;

interface FormulaSpec {
  id: number;
  name: string;
  tensFn: Fn;
  unitsFn: Fn;
  category: "even-even" | "odd-odd" | "even-odd";
}

/* ═══════════════════════════════════════════════════
   หมวด 1 — คู่+คู่  (both digits even)
   ═══════════════════════════════════════════════════ */

// EE-1: แต้มคูณถ่วง — tens: (TL×2+UL) → even, units: (UL×2+TL) → even
const ee1T: Fn = (data, idx) => toEven(d(data[idx].bottom, 0) * 2 + d(data[idx].bottom, 1));
const ee1U: Fn = (data, idx) => toEven(d(data[idx].bottom, 1) * 2 + d(data[idx].bottom, 0));

// EE-2: กระจกข้ามคู่ — tens: (9-TL+R) → even, units: (9-UL+U) → even
const ee2T: Fn = (data, idx) => toEven(9 - d(data[idx].bottom, 0) + d(data[idx].top, 0));
const ee2U: Fn = (data, idx) => toEven(9 - d(data[idx].bottom, 1) + d(data[idx].top, 2));

// EE-3: ผลคูณข้ามคู่ — tens: (TL×R) → even, units: (UL×U) → even
const ee3T: Fn = (data, idx) => toEven(d(data[idx].bottom, 0) * d(data[idx].top, 0));
const ee3U: Fn = (data, idx) => toEven(d(data[idx].bottom, 1) * d(data[idx].top, 2));

// EE-4: สามชั้นคู่ — tens: (R+UL+T) → even, units: (U+TL+T) → even
const ee4T: Fn = (data, idx) => toEven(d(data[idx].top, 0) + d(data[idx].bottom, 1) + d(data[idx].top, 1));
const ee4U: Fn = (data, idx) => toEven(d(data[idx].top, 2) + d(data[idx].bottom, 0) + d(data[idx].top, 1));

// EE-5: สองงวดไขว้คู่ — tens: (TL+TL_prev+UL_prev) → even, units: (UL+UL_prev+TL_prev) → even
const ee5T: Fn = (data, idx) => {
  if (idx < 1) return toEven(d(data[idx].bottom, 0) * 3);
  return toEven(d(data[idx].bottom, 0) + d(data[idx - 1].bottom, 0) + d(data[idx - 1].bottom, 1));
};
const ee5U: Fn = (data, idx) => {
  if (idx < 1) return toEven(d(data[idx].bottom, 1) * 3);
  return toEven(d(data[idx].bottom, 1) + d(data[idx - 1].bottom, 1) + d(data[idx - 1].bottom, 0));
};

/* ═══════════════════════════════════════════════════
   หมวด 2 — คี่+คี่  (both digits odd)
   ═══════════════════════════════════════════════════ */

// OO-1: ผลต่างถ่วงคี่ — tens: |TL×2-UL| → odd, units: |UL×2-TL| → odd
const oo1T: Fn = (data, idx) => toOdd(Math.abs(d(data[idx].bottom, 0) * 2 - d(data[idx].bottom, 1)));
const oo1U: Fn = (data, idx) => toOdd(Math.abs(d(data[idx].bottom, 1) * 2 - d(data[idx].bottom, 0)));

// OO-2: ย้อนกลับข้ามคี่ — tens: (10-TL+R) → odd, units: (10-UL+U) → odd
const oo2T: Fn = (data, idx) => toOdd(10 - d(data[idx].bottom, 0) + d(data[idx].top, 0));
const oo2U: Fn = (data, idx) => toOdd(10 - d(data[idx].bottom, 1) + d(data[idx].top, 2));

// OO-3: สลับรวมคี่ — tens: (UL+R) → odd, units: (TL+U) → odd
const oo3T: Fn = (data, idx) => toOdd(d(data[idx].bottom, 1) + d(data[idx].top, 0));
const oo3U: Fn = (data, idx) => toOdd(d(data[idx].bottom, 0) + d(data[idx].top, 2));

// OO-4: เฉลี่ยสามคี่ — tens: floor((TL+UL+R)/2) → odd, units: (TL×UL+T) → odd
const oo4T: Fn = (data, idx) =>
  toOdd(Math.floor((d(data[idx].bottom, 0) + d(data[idx].bottom, 1) + d(data[idx].top, 0)) / 2));
const oo4U: Fn = (data, idx) =>
  toOdd(d(data[idx].bottom, 0) * d(data[idx].bottom, 1) + d(data[idx].top, 1));

// OO-5: สองงวดสลับคี่ — tens: (TL+R_prev+UL_prev) → odd, units: (UL+U_prev+TL_prev) → odd
const oo5T: Fn = (data, idx) => {
  if (idx < 1) return toOdd(d(data[idx].bottom, 0) * 3 + 1);
  return toOdd(d(data[idx].bottom, 0) + d(data[idx - 1].top, 0) + d(data[idx - 1].bottom, 1));
};
const oo5U: Fn = (data, idx) => {
  if (idx < 1) return toOdd(d(data[idx].bottom, 1) * 3 + 1);
  return toOdd(d(data[idx].bottom, 1) + d(data[idx - 1].top, 2) + d(data[idx - 1].bottom, 0));
};

/* ═══════════════════════════════════════════════════
   หมวด 3 — คู่+คี่  (one even, one odd)
   ═══════════════════════════════════════════════════ */

// EO-1: แต้มสลับขั้ว — tens: (TL+UL) → even, units: |TL-UL|+R → odd
const eo1T: Fn = (data, idx) => toEven(d(data[idx].bottom, 0) + d(data[idx].bottom, 1));
const eo1U: Fn = (data, idx) =>
  toOdd(Math.abs(d(data[idx].bottom, 0) - d(data[idx].bottom, 1)) + d(data[idx].top, 0));

// EO-2: กระจกแยกขั้ว — tens: (9-TL) → even, units: (9-UL) → odd
const eo2T: Fn = (data, idx) => toEven(9 - d(data[idx].bottom, 0));
const eo2U: Fn = (data, idx) => toOdd(9 - d(data[idx].bottom, 1));

// EO-3: ร้อยรวมสลับ — tens: (R+T+U) → odd, units: (TL+UL+R) → even
const eo3T: Fn = (data, idx) =>
  toOdd(d(data[idx].top, 0) + d(data[idx].top, 1) + d(data[idx].top, 2));
const eo3U: Fn = (data, idx) =>
  toEven(d(data[idx].bottom, 0) + d(data[idx].bottom, 1) + d(data[idx].top, 0));

// EO-4: ผลคูณสลับ — tens: (TL×UL) → odd, units: (R×U) → even
const eo4T: Fn = (data, idx) => toOdd(d(data[idx].bottom, 0) * d(data[idx].bottom, 1));
const eo4U: Fn = (data, idx) => toEven(d(data[idx].top, 0) * d(data[idx].top, 2));

// EO-5: สองงวดข้ามขั้ว — tens: (TL+UL_prev) → even, units: (UL+TL_prev) → odd
const eo5T: Fn = (data, idx) => {
  if (idx < 1) return toEven(d(data[idx].bottom, 0) + d(data[idx].bottom, 1));
  return toEven(d(data[idx].bottom, 0) + d(data[idx - 1].bottom, 1));
};
const eo5U: Fn = (data, idx) => {
  if (idx < 1) return toOdd(d(data[idx].bottom, 1) + d(data[idx].bottom, 0));
  return toOdd(d(data[idx].bottom, 1) + d(data[idx - 1].bottom, 0));
};

/* ═══════ All 15 formulas ═══════ */

const ALL_FORMULAS: FormulaSpec[] = [
  // หมวด 1: คู่+คู่
  { id: 1, name: "แต้มคูณถ่วง", tensFn: ee1T, unitsFn: ee1U, category: "even-even" },
  { id: 2, name: "กระจกข้ามคู่", tensFn: ee2T, unitsFn: ee2U, category: "even-even" },
  { id: 3, name: "ผลคูณข้ามคู่", tensFn: ee3T, unitsFn: ee3U, category: "even-even" },
  { id: 4, name: "สามชั้นคู่", tensFn: ee4T, unitsFn: ee4U, category: "even-even" },
  { id: 5, name: "สองงวดไขว้คู่", tensFn: ee5T, unitsFn: ee5U, category: "even-even" },
  // หมวด 2: คี่+คี่
  { id: 6, name: "ผลต่างถ่วงคี่", tensFn: oo1T, unitsFn: oo1U, category: "odd-odd" },
  { id: 7, name: "ย้อนกลับข้ามคี่", tensFn: oo2T, unitsFn: oo2U, category: "odd-odd" },
  { id: 8, name: "สลับรวมคี่", tensFn: oo3T, unitsFn: oo3U, category: "odd-odd" },
  { id: 9, name: "เฉลี่ยสามคี่", tensFn: oo4T, unitsFn: oo4U, category: "odd-odd" },
  { id: 10, name: "สองงวดสลับคี่", tensFn: oo5T, unitsFn: oo5U, category: "odd-odd" },
  // หมวด 3: คู่+คี่
  { id: 11, name: "แต้มสลับขั้ว", tensFn: eo1T, unitsFn: eo1U, category: "even-odd" },
  { id: 12, name: "กระจกแยกขั้ว", tensFn: eo2T, unitsFn: eo2U, category: "even-odd" },
  { id: 13, name: "ร้อยรวมสลับ", tensFn: eo3T, unitsFn: eo3U, category: "even-odd" },
  { id: 14, name: "ผลคูณสลับ", tensFn: eo4T, unitsFn: eo4U, category: "even-odd" },
  { id: 15, name: "สองงวดข้ามขั้ว", tensFn: eo5T, unitsFn: eo5U, category: "even-odd" },
];

/* ═══════ Compute ═══════ */

interface HistoryRow { date: string; bottom: string; predictedPair: string; match: boolean }
interface FormulaResult {
  id: number;
  name: string;
  category: "even-even" | "odd-odd" | "even-odd";
  deadTens: number;
  deadUnits: number;
  deadPair: string;
  pass: number;
  total: number;
  pct: number;
  history: HistoryRow[];
}

function computeAll(data: ParsedEntry[]): FormulaResult[] | null {
  if (data.length < 4) return null;
  const n = data.length;

  return ALL_FORMULAS.map((f) => {
    const deadT = f.tensFn(data, n - 1);
    const deadU = f.unitsFn(data, n - 1);
    const deadPair = `${deadT}${deadU}`;

    let pass = 0, total = 0;
    const history: HistoryRow[] = [];

    for (let i = 2; i < n - 1; i++) {
      const pt = f.tensFn(data, i);
      const pu = f.unitsFn(data, i);
      const predicted = `${pt}${pu}`;
      const actual = data[i + 1].bottom.padStart(2, "0");
      const match = predicted !== actual;
      total++;
      if (match) pass++;
      history.push({ date: data[i + 1].date, bottom: actual, predictedPair: predicted, match });
    }

    return {
      id: f.id, name: f.name, category: f.category,
      deadTens: deadT, deadUnits: deadU, deadPair,
      pass, total, pct: total > 0 ? (pass / total) * 100 : 0,
      history: history.reverse().slice(0, 15),
    };
  });
}

/* ═══════ Tier color helpers ═══════ */

function tierColor(pct: number) {
  if (pct >= 95) return "from-emerald-600 to-teal-600";
  if (pct >= 90) return "from-blue-600 to-indigo-600";
  if (pct >= 85) return "from-amber-500 to-orange-500";
  return "from-red-500 to-rose-500";
}
function tierBorder(pct: number) {
  if (pct >= 95) return "border-emerald-300";
  if (pct >= 90) return "border-blue-300";
  if (pct >= 85) return "border-amber-300";
  return "border-red-300";
}

const CATEGORY_META: Record<string, { title: string; label: string; color: string; bg: string; border: string }> = {
  "even-even": { title: "หมวด 1: คู่+คู่ (ทั้งสองหลักเป็นเลขคู่)", label: "คู่+คู่", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  "odd-odd":   { title: "หมวด 2: คี่+คี่ (ทั้งสองหลักเป็นเลขคี่)", label: "คี่+คี่", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  "even-odd":  { title: "หมวด 3: คู่+คี่ (หลักหนึ่งคู่ หลักหนึ่งคี่)", label: "คู่+คี่", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
};

/* ═══════ Main Component ═══════ */

export default function Tool039ParityPairDead() {
  const [activeTab, setActiveTab] = useState<"even-even" | "odd-odd" | "even-odd">("even-even");

  return (
    <ToolShell title="ดับล่าง คู่-คี่" desc="15 สูตรดับคู่ล่าง — คู่+คู่ 5 / คี่+คี่ 5 / คู่+คี่ 5" minEntries={4}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const results = useMemo(() => computeAll(data), [data]);

        if (!results) return <DataInput value={localInput} onChange={setLocalInput} />;

        const grouped = {
          "even-even": results.filter((r) => r.category === "even-even"),
          "odd-odd": results.filter((r) => r.category === "odd-odd"),
          "even-odd": results.filter((r) => r.category === "even-odd"),
        };

        const perfect = results.filter((r) => r.total > 0 && r.pass === r.total);
        const activeResults = grouped[activeTab];
        const meta = CATEGORY_META[activeTab];

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {/* ─── Perfect 100% banner ─── */}
            {perfect.length > 0 && (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 animate-[fadeIn_0.3s]">
                <h3 className="mb-2 font-bold text-green-800">✨ สูตรแม่น 100%</h3>
                <div className="flex flex-wrap gap-2">
                  {perfect.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { copyText(r.deadPair); showToast(`คัดลอก ${r.deadPair}`); }}
                      className="rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white shadow hover:bg-green-700 transition"
                    >
                      {r.name}: {r.deadPair}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const txt = perfect.map((r) => r.deadPair).join(" ");
                    copyText(txt); showToast("คัดลอกคู่ดับแม่น 100% ทั้งหมด");
                  }}
                  className="mt-2 w-full rounded-lg bg-green-700 px-3 py-2 text-sm font-bold text-white shadow hover:bg-green-800 transition"
                >
                  📋 คัดลอกทั้งหมด ({perfect.map((r) => r.deadPair).join(" ")})
                </button>
              </div>
            )}

            {/* ─── Category Tabs ─── */}
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              {(["even-even", "odd-odd", "even-odd"] as const).map((cat) => {
                const m = CATEGORY_META[cat];
                const catResults = grouped[cat];
                const best = Math.max(...catResults.map((r) => r.pct));
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-bold transition-all ${
                      activeTab === cat
                        ? `bg-white shadow ${m.color}`
                        : "text-ink/40 hover:text-ink/60"
                    }`}
                  >
                    <div>{m.label}</div>
                    <div className="text-[10px] font-normal mt-0.5 opacity-60">
                      best {best.toFixed(0)}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ─── Active Category ─── */}
            <div className={`rounded-xl border-2 ${meta.border} ${meta.bg} p-4 animate-[fadeIn_0.3s]`}>
              <h3 className={`font-bold ${meta.color} mb-3`}>{meta.title}</h3>

              {/* 5 Pair Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {activeResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { copyText(r.deadPair); showToast(`คัดลอก ${r.deadPair}`); }}
                    className={`rounded-2xl border-2 ${tierBorder(r.pct)} bg-white p-3 text-center shadow-sm hover:shadow-md transition-all active:scale-95`}
                  >
                    <div className="text-[10px] font-bold uppercase text-ink/40">#{r.id}</div>
                    <div className="text-[10px] text-ink/50 mt-0.5 truncate">{r.name}</div>
                    <div className={`mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r ${tierColor(r.pct)} px-4 py-1.5 shadow-lg`}>
                      <span className="text-3xl font-black text-white tracking-wider">{r.deadPair}</span>
                    </div>
                    <div className="mt-2 text-xs font-bold text-emerald-600">
                      {r.pass}/{r.total} ({r.pct.toFixed(0)}%)
                    </div>
                  </button>
                ))}
              </div>

              {/* Copy Category Button */}
              <button
                onClick={() => {
                  const txt = activeResults.map((r) => r.deadPair).join(" ");
                  copyText(txt); showToast(`คัดลอก ${meta.label}: ${txt}`);
                }}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
              >
                📋 คัดลอกคู่ดับ {meta.label} ทั้ง 5 คู่
              </button>
            </div>

            {/* ─── Formula Details Table ─── */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
              <div className="border-b border-ink/10 px-4 py-3 text-sm font-bold text-ink/70">
                🔢 รายละเอียดสูตร {meta.label}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-ink/50">
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">ชื่อ</th>
                      <th className="px-3 py-2 text-center">ดับสิบ</th>
                      <th className="px-3 py-2 text-center">ดับหน่วย</th>
                      <th className="px-3 py-2 text-center">คู่ดับ</th>
                      <th className="px-3 py-2 text-center">ผ่าน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeResults.map((r) => (
                      <tr key={r.id} className="border-t border-ink/5">
                        <td className="px-3 py-2 font-bold text-ink/60">{r.id}</td>
                        <td className="px-3 py-2 text-ink/70">{r.name}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 font-black text-blue-700">{r.deadTens}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 font-black text-emerald-700">{r.deadUnits}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex rounded-lg bg-violet-100 px-2 py-1 font-black text-violet-700">{r.deadPair}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            r.pct >= 95 ? "bg-emerald-100 text-emerald-700"
                              : r.pct >= 90 ? "bg-blue-100 text-blue-700"
                              : r.pct >= 85 ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            {r.pass}/{r.total} ({r.pct.toFixed(0)}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── Copy All 15 Button ─── */}
            <button
              onClick={() => {
                const txt = results.map((r) => r.deadPair).join(" ");
                copyText(txt); showToast("คัดลอกคู่ดับทั้ง 15 คู่");
              }}
              className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 py-3 font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
            >
              📋 คัดลอกคู่ดับทั้ง 15 คู่ (ทุกหมวด)
            </button>

            {/* ─── History per formula ─── */}
            {activeResults.map((r) => (
              <details key={r.id} className="rounded-2xl border border-ink/10 bg-white shadow-sm">
                <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-ink/70 hover:bg-gray-50">
                  📅 #{r.id} {r.name} [{r.deadPair}] — ย้อนหลัง {r.history.length} งวด
                  <span className="ml-2 text-xs font-normal text-emerald-600">({r.pct.toFixed(0)}%)</span>
                </summary>
                <div className="overflow-x-auto border-t border-ink/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-ink/50">
                        <th className="px-3 py-2 text-left">วันที่</th>
                        <th className="px-3 py-2 text-center">ล่างจริง</th>
                        <th className="px-3 py-2 text-center">คู่ดับ</th>
                        <th className="px-3 py-2 text-center">ผล</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.history.map((h, hi) => (
                        <tr
                          key={hi}
                          className={`border-t border-ink/5 ${h.match ? "hover:bg-emerald-50/40" : "hover:bg-red-50/30"}`}
                        >
                          <td className="whitespace-nowrap px-3 py-2 text-ink/60">{h.date}</td>
                          <td className="px-3 py-2 text-center font-black text-ink/80">{h.bottom}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex rounded-lg px-2 py-0.5 font-bold ${
                              h.match ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                            }`}>
                              {h.predictedPair}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {h.match ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">✓ ผ่าน</span>
                            ) : (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">✗ ไม่ผ่าน</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        );
      }}
    </ToolShell>
  );
}
