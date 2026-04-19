"use client";
import { useMemo, useState } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";
import { FORMULAS_16 as FORMULAS } from "./shared-formulas-16";

/* ═══════════════════════════════════════════════════════════════
   34. คู่ดับ 2 ตัวล่าง — เลือกเองได้ (จาก 16 สูตร)
   ─────────────────────────────────────────────────
   เลือกสูตรใดก็ได้ 2 สูตรจาก 16 สูตรมาจับคู่เป็นคู่ดับ
   ผ่าน = เขียว 1-2 ตัว หรือเลขเบิ้ล
   ไม่ผ่าน = แดงทั้งสองตัว (ยกเว้นเบิ้ล)
   ═══════════════════════════════════════════════════════════════ */

/* ─── types ─── */
interface HistoryRow {
  date: string;
  bottom: string;
  bt: number;
  bu: number;
  v1: number;
  v2: number;
  ok1: boolean;
  ok2: boolean;
  isDouble: boolean;
  pass: boolean;
}

interface ComputeResult {
  d1: number;
  d2: number;
  pass: number;
  total: number;
  pct: number;
  history: HistoryRow[];
}

/* ─── core compute ─── */
function compute(data: ParsedEntry[], f1Idx: number, f2Idx: number): ComputeResult | null {
  if (data.length < 5) return null;
  const n = data.length;
  const FA = FORMULAS[f1Idx];
  const FB = FORMULAS[f2Idx];

  const d1 = FA.fn(data, n - 1);
  const d2 = FB.fn(data, n - 1);

  let pass = 0;
  let total = 0;
  const history: HistoryRow[] = [];

  for (let i = 1; i < n - 1; i++) {
    const v1 = FA.fn(data, i);
    const v2 = FB.fn(data, i);
    const nextB = data[i + 1].bottom;
    const bt = d(nextB, 0);
    const bu = d(nextB, 1);
    const ok1 = v1 !== bt && v1 !== bu;
    const ok2 = v2 !== bt && v2 !== bu;
    const isDouble = v1 === v2;
    const rowPass = isDouble || ok1 || ok2;
    total++;
    if (rowPass) pass++;

    history.push({
      date: data[i + 1].date,
      bottom: data[i + 1].bottom,
      bt,
      bu,
      v1,
      v2,
      ok1,
      ok2,
      isDouble,
      pass: rowPass,
    });
  }

  // reverse to newest-first, keep last 15
  const histSlice = history.reverse().slice(0, 15);

  return {
    d1,
    d2,
    pass,
    total,
    pct: total > 0 ? (pass / total) * 100 : 0,
    history: histSlice,
  };
}

/* ─── color helpers ─── */
function tierColor(pct: number) {
  if (pct >= 75)
    return { text: "text-emerald-600", bg: "bg-emerald-500", ring: "ring-emerald-400", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-400", from: "from-emerald-50", gradient: "from-emerald-600 to-teal-600" };
  if (pct >= 65)
    return { text: "text-blue-600", bg: "bg-blue-500", ring: "ring-blue-400", badge: "bg-blue-100 text-blue-700", border: "border-blue-400", from: "from-blue-50", gradient: "from-blue-600 to-indigo-600" };
  if (pct >= 55)
    return { text: "text-amber-600", bg: "bg-amber-500", ring: "ring-amber-400", badge: "bg-amber-100 text-amber-700", border: "border-amber-400", from: "from-amber-50", gradient: "from-amber-500 to-orange-500" };
  return { text: "text-red-500", bg: "bg-red-500", ring: "ring-red-400", badge: "bg-red-100 text-red-700", border: "border-red-400", from: "from-red-50", gradient: "from-red-500 to-rose-500" };
}

/* ─── Formula Selector Component ─── */
function FormulaSelector({
  label,
  selected,
  onChange,
  disabledIdx,
}: {
  label: string;
  selected: number;
  onChange: (idx: number) => void;
  disabledIdx: number;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/10 px-4 py-3">
        <span className="text-sm font-bold text-ink/70">{label}</span>
        <span className="ml-2 text-xs text-ink/40">
          เลือกได้ 1 สูตร (ปัจจุบัน: #{FORMULAS[selected].id} {FORMULAS[selected].name})
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 p-3 sm:grid-cols-8">
        {FORMULAS.map((f, idx) => {
          const isSelected = idx === selected;
          const isDisabled = idx === disabledIdx;
          return (
            <button
              key={f.id}
              disabled={isDisabled}
              onClick={() => onChange(idx)}
              title={`#${f.id} ${f.name}\n${f.desc}`}
              className={[
                "relative flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-bold transition-all",
                isSelected
                  ? "bg-violet-600 text-white ring-2 ring-violet-400 shadow-md scale-[1.05]"
                  : isDisabled
                  ? "cursor-not-allowed bg-gray-100 text-gray-300"
                  : "bg-gray-50 text-ink/60 hover:bg-violet-50 hover:text-violet-700 hover:ring-1 hover:ring-violet-300 active:scale-95",
              ].join(" ")}
            >
              <span className={`text-[9px] ${isSelected ? "text-white/70" : "text-ink/30"}`}>#{f.id}</span>
              <span className="mt-0.5 leading-tight text-center" style={{ fontSize: "9px" }}>
                {f.name.length > 8 ? f.name.slice(0, 8) + "…" : f.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Results Component ─── */
function Results({
  result,
  f1Idx,
  f2Idx,
  showToast,
}: {
  result: ComputeResult;
  f1Idx: number;
  f2Idx: number;
  showToast: (msg: string) => void;
}) {
  const c = tierColor(result.pct);
  const fa = FORMULAS[f1Idx];
  const fb = FORMULAS[f2Idx];
  const isDouble = result.d1 === result.d2;

  return (
    <div className="animate-[fadeIn_0.5s] space-y-4">

      {/* ─── Result Banner ─── */}
      <div className={`rounded-2xl bg-gradient-to-r ${c.gradient} p-4 text-white shadow-lg`}>
        <div className="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
          🎯 คู่ดับที่เลือก — สูตร #{fa.id} + สูตร #{fb.id}
        </div>
        <div className="text-[11px] opacity-70 mb-3">
          {fa.name} &amp; {fb.name}
        </div>

        {/* Dead pair display */}
        <div className="flex items-center justify-center gap-4 my-2">
          <div className="flex flex-col items-center">
            <span className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-4 ring-white/40 bg-white/20 text-5xl font-black shadow-lg`}>
              {result.d1}
            </span>
            <span className="mt-1 text-[10px] opacity-70">#{fa.id} {fa.name}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black opacity-50">✕</span>
            {isDouble && (
              <span className="mt-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">
                เบิ้ล
              </span>
            )}
          </div>
          <div className="flex flex-col items-center">
            <span className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-4 ring-white/40 bg-white/20 text-5xl font-black shadow-lg`}>
              {result.d2}
            </span>
            <span className="mt-1 text-[10px] opacity-70">#{fb.id} {fb.name}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/20 px-4 py-2">
          <div className="text-center">
            <div className="text-[10px] opacity-70">ผ่าน</div>
            <div className="text-lg font-black">{result.pass}/{result.total}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] opacity-70">ความแม่น</div>
            <div className="text-2xl font-black">{result.pct.toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] opacity-70">ย้อนหลัง</div>
            <div className="text-lg font-black">{result.total} งวด</div>
          </div>
        </div>
      </div>

      {/* ─── Copy Button ─── */}
      <button
        onClick={() => {
          const txt = `คู่ดับ [${result.d1}${result.d2}]  สูตร #${fa.id}×#${fb.id}  ${result.pct.toFixed(1)}%`;
          copyText(txt);
          showToast("คัดลอก: " + txt);
        }}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-center font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
      >
        📋 คัดลอกผลคู่ดับ [{result.d1}{result.d2}]
      </button>

      {/* ─── Backtest Condition Legend ─── */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-ink/10 bg-gray-50 px-4 py-2.5 text-[11px]">
        <span className="font-bold text-ink/50">เงื่อนไข:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-4 w-4 rounded bg-emerald-100 text-center text-[9px] font-bold leading-4 text-emerald-700">X</span>
          = ไม่ปรากฏ (ดับได้)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-4 w-4 rounded bg-red-100 text-center text-[9px] font-bold leading-4 text-red-600">X</span>
          = ปรากฏ (ดับไม่ได้)
        </span>
        <span className="flex items-center gap-1 font-semibold text-emerald-600">✓ ผ่าน</span>
        <span className="text-ink/40">= เขียว 1-2 ตัว หรือเบิ้ล</span>
        <span className="flex items-center gap-1 font-semibold text-red-500">✗ ไม่ผ่าน</span>
        <span className="text-ink/40">= แดงทั้งคู่ (ยกเว้นเบิ้ล)</span>
      </div>

      {/* ─── History Table ─── */}
      <details open className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-ink/70 hover:bg-gray-50">
          📅 ผลย้อนหลังรายงวด ({result.history.length} งวดล่าสุด)
        </summary>
        <div className="overflow-x-auto border-t border-ink/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="whitespace-nowrap px-3 py-2 text-left">วันที่</th>
                <th className="px-3 py-2 text-center">ล่าง</th>
                <th className="px-3 py-2 text-center" colSpan={2}>
                  สูตร #{fa.id} — #{fb.id}
                </th>
                <th className="px-3 py-2 text-center">ผล</th>
              </tr>
            </thead>
            <tbody>
              {result.history.map((h, ri) => (
                <tr
                  key={ri}
                  className={`border-t border-ink/5 ${h.pass ? "hover:bg-emerald-50/40" : "hover:bg-red-50/30"}`}
                >
                  <td className="whitespace-nowrap px-3 py-2 text-ink/60">
                    {h.date}
                  </td>
                  <td className="px-3 py-2 text-center font-black text-ink/80">
                    {h.bottom}
                  </td>
                  {/* digit 1 */}
                  <td className="px-2 py-2 text-center">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black ${
                        h.ok1
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}
                      title={`#${fa.id} ${fa.name}: ${h.v1} ${h.ok1 ? "✓" : "✗"}`}
                    >
                      {h.v1}
                    </span>
                  </td>
                  {/* digit 2 */}
                  <td className="px-2 py-2 text-center">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black ${
                        h.ok2
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}
                      title={`#${fb.id} ${fb.name}: ${h.v2} ${h.ok2 ? "✓" : "✗"}`}
                    >
                      {h.v2}
                    </span>
                  </td>
                  {/* Pass/Fail */}
                  <td className="px-3 py-2 text-center">
                    {h.isDouble ? (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                        เบิ้ล
                      </span>
                    ) : h.pass ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        ✓ ผ่าน
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        ✗ ไม่ผ่าน
                      </span>
                    )}
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

/* ─── Main Export ─── */
export default function Tool034CustomPairDead() {
  const [sel1, setSel1] = useState(0);  // index in FORMULAS
  const [sel2, setSel2] = useState(1);  // index in FORMULAS

  return (
    <ToolShell title="คู่ดับ 2 ตัวล่าง — เลือกสูตรเองได้" minEntries={5}>
      {({ data, localInput, setLocalInput, showToast }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const result = useMemo(
          () => compute(data, sel1, sel2),
          [data, sel1, sel2]
        );

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {/* ─── Formula Pickers ─── */}
            <FormulaSelector
              label="🔵 สูตรที่ 1"
              selected={sel1}
              onChange={(idx) => {
                if (idx !== sel2) setSel1(idx);
              }}
              disabledIdx={sel2}
            />
            <FormulaSelector
              label="🟣 สูตรที่ 2"
              selected={sel2}
              onChange={(idx) => {
                if (idx !== sel1) setSel2(idx);
              }}
              disabledIdx={sel1}
            />

            {/* ─── Results ─── */}
            {result && (
              <Results
                result={result}
                f1Idx={sel1}
                f2Idx={sel2}
                showToast={showToast}
              />
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
