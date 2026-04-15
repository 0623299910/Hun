"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/* ═══════════════════════════════════════════════════════════════
   35. รวมดับแต้ม — 15 สูตรดับแต้ม (แต้ม = (สิบ+หน่วย) ล่าง mod 10)
   ทำนายแต้มที่จะไม่ออกในงวดถัดไป
   พร้อมสถิติย้อนหลังทุกงวดในข้อมูล (ขั้นต่ำ 30 งวด)
   ═══════════════════════════════════════════════════════════════ */

type Fn = (dt: ParsedEntry[], idx: number) => number;

/** คำนวณแต้มล่าง */
function pt(e: ParsedEntry): number {
  return mod10(d(e.bottom, 0) + d(e.bottom, 1));
}

interface FormulaDef { name: string; desc: string; fn: Fn }

const FORMULAS: FormulaDef[] = [
  /* 1 — ผลรวม 3 ตัวบน mod 10 → ดับแต้ม */
  {
    name: "ผลรวมบน",
    desc: "(ร้อย+สิบ+หน่วย) บน mod 10",
    fn: (dt, i) => mod10(d(dt[i].top, 0) + d(dt[i].top, 1) + d(dt[i].top, 2)),
  },
  /* 2 — กระจกแต้มล่าง 9-complement */
  {
    name: "กระจกแต้ม",
    desc: "9 − แต้มล่าง",
    fn: (dt, i) => mod10(9 - pt(dt[i])),
  },
  /* 3 — แต้ม × 2 */
  {
    name: "แต้ม×2",
    desc: "แต้มล่าง × 2 mod 10",
    fn: (dt, i) => mod10(pt(dt[i]) * 2),
  },
  /* 4 — ร้อย + แต้ม */
  {
    name: "ร้อย+แต้ม",
    desc: "(หลักร้อย + แต้มล่าง) mod 10",
    fn: (dt, i) => mod10(d(dt[i].top, 0) + pt(dt[i])),
  },
  /* 5 — |แต้ม − ร้อย| */
  {
    name: "|แต้ม−ร้อย|",
    desc: "|แต้มล่าง − หลักร้อย|",
    fn: (dt, i) => Math.abs(pt(dt[i]) - d(dt[i].top, 0)),
  },
  /* 6 — แต้ม 2 งวดรวม */
  {
    name: "แต้ม 2 งวดรวม",
    desc: "(แต้มนี้ + แต้มก่อน) mod 10",
    fn: (dt, i) => {
      if (i < 1) return mod10(pt(dt[i]) * 2);
      return mod10(pt(dt[i]) + pt(dt[i - 1]));
    },
  },
  /* 7 — ผลต่างแต้ม 2 งวด */
  {
    name: "ผลต่างแต้ม",
    desc: "|แต้มนี้ − แต้มก่อน|",
    fn: (dt, i) => {
      if (i < 1) return pt(dt[i]);
      return Math.abs(pt(dt[i]) - pt(dt[i - 1]));
    },
  },
  /* 8 — (สิบล่าง + หน่วยบน) mod 10 */
  {
    name: "สิบล่าง+หน่วยบน",
    desc: "(สิบล่าง + หน่วยบน) mod 10",
    fn: (dt, i) => mod10(d(dt[i].bottom, 0) + d(dt[i].top, 2)),
  },
  /* 9 — (หน่วยล่าง + สิบบน) mod 10 */
  {
    name: "หน่วยล่าง+สิบบน",
    desc: "(หน่วยล่าง + สิบบน) mod 10",
    fn: (dt, i) => mod10(d(dt[i].bottom, 1) + d(dt[i].top, 1)),
  },
  /* 10 — Frequency Inverse: แต้มที่มาน้อยที่สุด */
  {
    name: "แต้มถี่ต่ำสุด",
    desc: "แต้มที่ออกน้อยสุดจากสถิติ",
    fn: (dt, i) => {
      const freq = Array(10).fill(0);
      for (let j = 0; j <= i; j++) freq[pt(dt[j])]++;
      let minF = Infinity, dead = 0;
      for (let k = 0; k < 10; k++) { if (freq[k] < minF) { minF = freq[k]; dead = k; } }
      return dead;
    },
  },
  /* 11 — Gap สูงสุด: แต้มที่ห่างนานที่สุด */
  {
    name: "Gap สูงสุด",
    desc: "แต้มที่ไม่ออกนานสุด",
    fn: (dt, i) => {
      const lastSeen = Array(10).fill(-1);
      for (let j = 0; j <= i; j++) lastSeen[pt(dt[j])] = j;
      const gap = lastSeen.map((ls) => (ls === -1 ? i + 1 : i - ls));
      let maxG = -1, dead = 0;
      for (let k = 0; k < 10; k++) { if (gap[k] > maxG) { maxG = gap[k]; dead = k; } }
      return dead;
    },
  },
  /* 12 — Diff Chain แต้ม 3 งวด */
  {
    name: "Diff Chain แต้ม",
    desc: "ผลต่าง+ความเร่งแต้ม 3 งวด",
    fn: (dt, i) => {
      if (i < 2) return mod10(pt(dt[i]) * 3);
      const p0 = pt(dt[i]), p1 = pt(dt[i - 1]), p2 = pt(dt[i - 2]);
      const d1 = mod10(p0 - p1 + 10);
      const d2 = mod10(p1 - p2 + 10);
      const accel = mod10(d1 - d2 + 10);
      return mod10(p0 + mod10(d1 + accel));
    },
  },
  /* 13 — ผลรวม 5 หลัก mod 10 */
  {
    name: "ผลรวม 5 หลัก",
    desc: "Σ(ร+ส+ห+สL+หL) mod 10",
    fn: (dt, i) =>
      mod10(d(dt[i].top, 0) + d(dt[i].top, 1) + d(dt[i].top, 2) + d(dt[i].bottom, 0) + d(dt[i].bottom, 1)),
  },
  /* 14 — (ร้อย × หน่วยล่าง) mod 10 */
  {
    name: "ร้อย×หน่วยล่าง",
    desc: "(ร้อย × หน่วยล่าง) mod 10",
    fn: (dt, i) => mod10(d(dt[i].top, 0) * d(dt[i].bottom, 1)),
  },
  /* 15 — |ΣTop − ΣBot| mod 10 */
  {
    name: "|รวมบน−รวมล่าง|",
    desc: "|ผลรวม 3 ตัวบน − ผลรวม 2 ตัวล่าง| mod 10",
    fn: (dt, i) => {
      const st = d(dt[i].top, 0) + d(dt[i].top, 1) + d(dt[i].top, 2);
      const sb = d(dt[i].bottom, 0) + d(dt[i].bottom, 1);
      return mod10(Math.abs(st - sb));
    },
  },
];

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
  point: number;
  preds: number[];
  passCount: number;
}
interface ComputeResult {
  formulas: ComputedFormula[];
  allDeadText: string;
  consensus: { digit: number; count: number }[];
  history: HistoryRow[];
  avgPct: number;
  lastPoint: number;
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
      const nextPoint = pt(data[i + 1]);
      total++;
      if (predicted !== nextPoint) pass++;
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

  /* history – all available draws for backtest */
  const histLen = Math.min(n - 2, n);
  const history: HistoryRow[] = [];
  for (let i = n - 2; i >= 1; i--) {
    const preds = FORMULAS.map((f) => f.fn(data, i));
    const nextPoint = pt(data[i + 1]);
    let passCount = 0;
    preds.forEach((p) => { if (p !== nextPoint) passCount++; });
    history.push({
      date: data[i + 1].date,
      bottom: data[i + 1].bottom,
      point: nextPoint,
      preds,
      passCount,
    });
  }

  const allDeadText = formulas.map((r) => r.dead).join(" ");
  const avgPct = formulas.reduce((s, f) => s + f.pct, 0) / formulas.length;
  const lastPoint = pt(data[n - 1]);

  return { formulas, allDeadText, consensus, history, avgPct, lastPoint };
}

/* ─── color helpers ─── */
function tierColor(pct: number) {
  if (pct >= 88) return { text: "text-emerald-600", bg: "bg-emerald-500", border: "border-emerald-300", badge: "bg-emerald-100 text-emerald-700", from: "from-emerald-50" };
  if (pct >= 84) return { text: "text-blue-600", bg: "bg-blue-500", border: "border-blue-300", badge: "bg-blue-100 text-blue-700", from: "from-blue-50" };
  if (pct >= 80) return { text: "text-amber-600", bg: "bg-amber-500", border: "border-amber-300", badge: "bg-amber-100 text-amber-700", from: "from-amber-50" };
  return { text: "text-red-500", bg: "bg-red-500", border: "border-red-300", badge: "bg-red-100 text-red-700", from: "from-red-50" };
}

/* ─── inner component ─── */
function Results({ result, showToast }: { result: ComputeResult; showToast: (msg: string) => void }) {
  const sorted = useMemo(() => [...result.formulas].sort((a, b) => b.pct - a.pct), [result.formulas]);

  return (
    <div className="animate-[fadeIn_0.5s] space-y-5">
      {/* ─── แต้มล่าสุด ─── */}
      <div className="text-center text-sm text-ink/60">
        แต้มล่างงวดล่าสุด = <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-xl font-black text-white">{result.lastPoint}</span>
      </div>

      {/* ─── Consensus ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 p-4 text-white shadow-lg">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider opacity-80">
          🎯 ฉันทามติ — แต้มดับที่หลายสูตรเห็นตรงกัน
        </div>
        <div className="flex flex-wrap gap-3">
          {result.consensus.map((c) => (
            <div key={c.digit} className="flex items-center gap-1.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl font-black backdrop-blur-sm">
                {c.digit}
              </span>
              <span className="text-sm font-bold opacity-90">×{c.count} สูตร</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] opacity-70">
          ความแม่นเฉลี่ยรวม {result.avgPct.toFixed(1)}% &nbsp;|&nbsp; ข้อมูลย้อนหลัง {result.formulas[0]?.total || 0} งวด
        </div>
      </div>

      {/* ─── 15 Formula Cards ─── */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {result.formulas.map((f) => {
          const c = tierColor(f.pct);
          return (
            <div key={f.idx} className={`relative overflow-hidden rounded-xl border-2 ${c.border} bg-gradient-to-br ${c.from} to-white p-3 shadow-sm transition hover:shadow-md`}>
              <div className={`absolute -top-0.5 -left-0.5 rounded-br-lg ${c.badge} px-2 py-0.5 text-[10px] font-bold`}>
                #{f.idx}
              </div>
              <div className="mt-3 text-[11px] font-bold leading-tight text-ink/70">{f.name}</div>
              <div className={`my-2 text-center text-4xl font-black ${c.text}`}>{f.dead}</div>
              <div className="text-[9px] leading-tight text-ink/40">{f.desc}</div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200/60">
                <div className={`h-full rounded-full ${c.bg} transition-all duration-500`} style={{ width: `${Math.min(f.pct, 100)}%` }} />
              </div>
              <div className={`mt-1 text-right text-xs font-bold ${c.text}`}>
                {f.pct.toFixed(1)}%
                <span className="ml-1 text-[10px] font-normal text-ink/40">({f.pass}/{f.total})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Copy ─── */}
      <button
        onClick={() => { copyText(result.allDeadText); showToast("คัดลอก: " + result.allDeadText); }}
        className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 py-3 text-center font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
      >
        📋 คัดลอกแต้มดับทั้ง 15 สูตร
      </button>

      {/* ─── Ranking Table ─── */}
      <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-4 py-3">
          <h3 className="text-sm font-bold text-ink/70">📊 อันดับความแม่นยำ (จากมากไปน้อย)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="px-3 py-2 text-left">อันดับ</th>
                <th className="px-3 py-2 text-left">สูตร</th>
                <th className="px-3 py-2 text-center">ดับแต้ม</th>
                <th className="px-3 py-2 text-right">ถูก/รวม</th>
                <th className="px-3 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f, rank) => {
                const c = tierColor(f.pct);
                return (
                  <tr key={f.idx} className="border-t border-ink/5 hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-bold text-ink/40">{rank + 1}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-ink/80">#{f.idx} {f.name}</span>
                      <div className="text-[9px] text-ink/40">{f.desc}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${c.badge} text-sm font-black`}>{f.dead}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-ink/50">{f.pass}/{f.total}</td>
                    <td className={`px-3 py-2 text-right font-bold ${c.text}`}>{f.pct.toFixed(1)}%</td>
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
          📅 สถิติย้อนหลังรายงวด ({result.history.length} งวด)
        </summary>
        <div className="overflow-x-auto border-t border-ink/10">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="whitespace-nowrap px-2 py-2 text-left">วันที่</th>
                <th className="px-2 py-2 text-center">ล่าง</th>
                <th className="px-2 py-2 text-center">แต้ม</th>
                <th className="px-2 py-2 text-center">ถูก</th>
                <th className="px-2 py-2 text-left">สูตร 1→15 (เขียว=ถูก แดง=พลาด)</th>
              </tr>
            </thead>
            <tbody>
              {result.history.map((h) => (
                <tr key={h.date} className="border-t border-ink/5">
                  <td className="whitespace-nowrap px-2 py-1.5 text-ink/60">{h.date}</td>
                  <td className="px-2 py-1.5 text-center font-bold text-ink/80">{h.bottom}</td>
                  <td className="px-2 py-1.5 text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{h.point}</span>
                  </td>
                  <td className="px-2 py-1.5 text-center font-bold text-emerald-600">{h.passCount}/15</td>
                  <td className="px-2 py-1.5">
                    <div className="flex flex-wrap gap-[3px]">
                      {h.preds.map((p, fi) => {
                        const ok = p !== h.point;
                        return (
                          <span
                            key={fi}
                            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                            title={`สูตร ${fi + 1}: ดับแต้ม ${p} ${ok ? "✓ ถูก" : "✗ พลาด"}`}
                          >
                            {p}
                          </span>
                        );
                      })}
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
export default function Tool035CombinedPointDead() {
  return (
    <ToolShell title="รวมดับแต้ม 15 สูตร" minEntries={5}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-5">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result ? (
              <Results result={result} showToast={showToast} />
            ) : (
              <div className="rounded-xl bg-violet-50 p-6 text-center text-sm text-ink/50">
                ⏳ ต้องการข้อมูลอย่างน้อย 5 งวด (แนะนำ 30 งวดขึ้นไป)
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
