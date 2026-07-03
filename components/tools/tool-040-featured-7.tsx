"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

type StartFn = (dt: ParsedEntry[], upTo: number) => number;

function makeWindow(start: number): number[] {
  return Array.from({ length: 7 }, (_, i) => (start + i) % 10);
}

const FORMULAS: { name: string; desc: string; startFn: StartFn }[] = [
  { name: "หลักสิบล่าง", desc: "start = หลักสิบสองตัวล่างงวดนี้", startFn: (dt, upTo) => d(dt[upTo].bottom, 0) },
  { name: "หลักหน่วยล่าง", desc: "start = หลักหน่วยสองตัวล่างงวดนี้", startFn: (dt, upTo) => d(dt[upTo].bottom, 1) },
  { name: "แต้มสองตัวล่าง", desc: "start = (สิบ+หน่วย) mod10 ของสองตัวล่าง", startFn: (dt, upTo) => mod10(d(dt[upTo].bottom, 0) + d(dt[upTo].bottom, 1)) },
  { name: "หลักร้อยตัวบน", desc: "start = หลักร้อยของสามตัวบนงวดนี้", startFn: (dt, upTo) => d(dt[upTo].top, 0) },
  { name: "ผลรวมสามตัวบน", desc: "start = (ร้อย+สิบ+หน่วย) mod10 ของสามตัวบน", startFn: (dt, upTo) => mod10(d(dt[upTo].top, 0) + d(dt[upTo].top, 1) + d(dt[upTo].top, 2)) },
  { name: "กระจก 9 (สิบล่าง)", desc: "start = 9 − หลักสิบสองตัวล่าง", startFn: (dt, upTo) => 9 - d(dt[upTo].bottom, 0) },
  { name: "กระจก 9 (หน่วยล่าง)", desc: "start = 9 − หลักหน่วยสองตัวล่าง", startFn: (dt, upTo) => 9 - d(dt[upTo].bottom, 1) },
  { name: "ผลต่างสิบ−หน่วย", desc: "start = |หลักสิบ − หลักหน่วย| ของสองตัวล่าง", startFn: (dt, upTo) => Math.abs(d(dt[upTo].bottom, 0) - d(dt[upTo].bottom, 1)) },
  { name: "รวมร้อย+สิบล่าง", desc: "start = (หลักร้อยบน + หลักสิบล่าง) mod10", startFn: (dt, upTo) => mod10(d(dt[upTo].top, 0) + d(dt[upTo].bottom, 0)) },
  { name: "รวมร้อย+หน่วยล่าง", desc: "start = (หลักร้อยบน + หลักหน่วยล่าง) mod10", startFn: (dt, upTo) => mod10(d(dt[upTo].top, 0) + d(dt[upTo].bottom, 1)) },
  {
    name: "ความถี่สูงสุด",
    desc: "start = เลขที่ออกบ่อยที่สุดใน 10 งวดล่าสุด",
    startFn: (dt, upTo) => {
      const freq = Array(10).fill(0);
      for (let i = Math.max(0, upTo - 9); i <= upTo; i++) { freq[d(dt[i].bottom, 0)]++; freq[d(dt[i].bottom, 1)]++; }
      let maxF = -1; let best = 0;
      for (let digit = 0; digit < 10; digit++) { if (freq[digit] > maxF) { maxF = freq[digit]; best = digit; } }
      return best;
    },
  },
  {
    name: "ห่างนานสุด",
    desc: "start = เลขที่ไม่ออกมานานที่สุด",
    startFn: (dt, upTo) => {
      const lastSeen = Array(10).fill(-1);
      for (let i = 0; i <= upTo; i++) { lastSeen[d(dt[i].bottom, 0)] = i; lastSeen[d(dt[i].bottom, 1)] = i; }
      let maxAbs = -1; let best = 0;
      for (let digit = 0; digit < 10; digit++) {
        const abs = lastSeen[digit] === -1 ? upTo + 10 : upTo - lastSeen[digit];
        if (abs > maxAbs) { maxAbs = abs; best = digit; }
      }
      return best;
    },
  },
];

interface ComputedFormula { idx: number; name: string; desc: string; start: number; window: number[]; pass: number; total: number; pct: number; }
interface HistoryRow { date: string; bottom: string; results: { window: number[]; pass: boolean }[]; passCount: number; }
interface ComputeResult { formulas: ComputedFormula[]; history: HistoryRow[]; avgPct: number; bestFormula: ComputedFormula; }

function compute(data: ParsedEntry[]): ComputeResult | null {
  if (data.length < 5) return null;
  const n = data.length;
  const BT_LEN = Math.min(25, n - 2);

  const formulas: ComputedFormula[] = FORMULAS.map((f, idx) => {
    const start = f.startFn(data, n - 1);
    const window = makeWindow(start);
    let pass = 0; let total = 0;
    for (let i = 1; i < n - 1; i++) {
      const s = f.startFn(data, i);
      const w = makeWindow(s);
      const nextT = d(data[i + 1].bottom, 0);
      const nextU = d(data[i + 1].bottom, 1);
      total++;
      if (w.includes(nextT) || w.includes(nextU)) pass++;
    }
    return { idx: idx + 1, name: f.name, desc: f.desc, start, window, pass, total, pct: total > 0 ? (pass / total) * 100 : 0 };
  });

  const history: HistoryRow[] = [];
  for (let i = n - 2; i >= Math.max(1, n - 1 - BT_LEN); i--) {
    const results = FORMULAS.map((f) => {
      const s = f.startFn(data, i);
      const w = makeWindow(s);
      const nextT = d(data[i + 1].bottom, 0);
      const nextU = d(data[i + 1].bottom, 1);
      return { window: w, pass: w.includes(nextT) || w.includes(nextU) };
    });
    history.push({ date: data[i + 1].date, bottom: data[i + 1].bottom, results, passCount: results.filter((r) => r.pass).length });
  }

  const avgPct = formulas.reduce((s, f) => s + f.pct, 0) / formulas.length;
  const bestFormula = [...formulas].sort((a, b) => b.pct - a.pct)[0];
  return { formulas, history, avgPct, bestFormula };
}

function tierColor(pct: number) {
  if (pct >= 80) return { text: "text-emerald-600", bg: "bg-emerald-500", border: "border-emerald-300", badge: "bg-emerald-100 text-emerald-700", from: "from-emerald-50" };
  if (pct >= 70) return { text: "text-blue-600", bg: "bg-blue-500", border: "border-blue-300", badge: "bg-blue-100 text-blue-700", from: "from-blue-50" };
  if (pct >= 60) return { text: "text-amber-600", bg: "bg-amber-500", border: "border-amber-300", badge: "bg-amber-100 text-amber-700", from: "from-amber-50" };
  return { text: "text-red-500", bg: "bg-red-500", border: "border-red-300", badge: "bg-red-100 text-red-700", from: "from-red-50" };
}

function WindowDisplay({ window: win, bg, size = "md" }: { window: number[]; bg: string; size?: "sm" | "md" }) {
  const cls = size === "sm"
    ? "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
    : "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black shadow-sm";
  return (
    <div className="flex items-center gap-0.5">
      {win.map((digit, i) => (
        <span key={i} className={`${cls} ${bg} text-white`}>{digit}</span>
      ))}
    </div>
  );
}

function Results({ result, showToast }: { result: ComputeResult; showToast: (msg: string) => void }) {
  const sorted = useMemo(() => [...result.formulas].sort((a, b) => b.pct - a.pct), [result.formulas]);
  return (
    <div className="animate-[fadeIn_0.5s] space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 p-4 text-white shadow-lg">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider opacity-70">
          🏆 สูตรแม่นสุด — #{result.bestFormula.idx} {result.bestFormula.name}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WindowDisplay window={result.bestFormula.window} bg="bg-white/30" />
          <div className="text-xs opacity-80 leading-snug">
            start = <span className="font-black text-xl">{result.bestFormula.start}</span>
            &nbsp;|&nbsp;{result.bestFormula.pct.toFixed(1)}% ({result.bestFormula.pass}/{result.bestFormula.total} งวด)
          </div>
        </div>
        <div className="mt-2 text-[11px] opacity-60">
          ความแม่นเฉลี่ย {result.avgPct.toFixed(1)}% &nbsp;|&nbsp; ข้อมูล {result.formulas[0]?.total || 0} งวด
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {result.formulas.map((f) => {
          const c = tierColor(f.pct);
          return (
            <div key={f.idx} className={`relative overflow-hidden rounded-xl border-2 ${c.border} bg-gradient-to-br ${c.from} to-white p-3 shadow-sm transition hover:shadow-md`}>
              <div className={`absolute -top-0.5 -left-0.5 rounded-br-lg ${c.badge} px-2 py-0.5 text-[10px] font-bold`}>#{f.idx}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[11px] font-bold leading-tight text-ink/70">{f.name}</span>
                <span className={`rounded px-1 py-0.5 text-[10px] font-black ${c.badge}`}>={f.start}</span>
              </div>
              <div className="mb-2 text-[9px] leading-tight text-ink/40">{f.desc}</div>
              <div className="flex justify-center">
                <WindowDisplay window={f.window} bg={c.bg} />
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200/60">
                <div className={`h-full rounded-full ${c.bg} transition-all duration-500`} style={{ width: `${Math.min(f.pct, 100)}%` }} />
              </div>
              <div className={`mt-1 flex items-center justify-between text-xs font-bold ${c.text}`}>
                <span className="text-[10px] font-normal text-ink/40">{f.pass}/{f.total}</span>
                <span>{f.pct.toFixed(1)}%</span>
              </div>
              <button
                onClick={() => { copyText(f.window.join("")); showToast(`คัดลอก #${f.idx}: ${f.window.join("")}`); }}
                className="mt-1.5 w-full rounded-lg bg-white/70 py-1 text-[10px] font-semibold text-ink/60 transition hover:bg-white active:scale-[0.98]"
              >
                📋 คัดลอก
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => { const t = result.bestFormula.window.join(""); copyText(t); showToast(`#${result.bestFormula.idx}: ${t}`); }}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 py-3 text-center font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
      >
        📋 คัดลอกเลขเด่น 7 ตัวจากสูตรแม่นที่สุด
      </button>

      <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-4 py-3">
          <h3 className="text-sm font-bold text-ink/70">📊 อันดับความแม่นยำ 12 สูตร</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="px-3 py-2 text-left">อันดับ</th>
                <th className="px-3 py-2 text-left">สูตร</th>
                <th className="px-3 py-2 text-center">start</th>
                <th className="px-3 py-2 text-center">7 ตัวเรียง</th>
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
                      <span className={`rounded px-1.5 py-0.5 text-xs font-black ${c.badge}`}>{f.start}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center">
                        <WindowDisplay window={f.window} bg={c.bg} size="sm" />
                      </div>
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

      <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-4 py-3">
          <h3 className="text-sm font-bold text-ink/70">📅 สถิติย้อนหลัง 25 งวด — ทุกสูตร</h3>
          <p className="mt-0.5 text-[11px] text-ink/40">✅ สองตัวล่างครอบ 1-2 ตัวในเลข 7 ตัวเรียงต่อเนื่อง &nbsp;|&nbsp; ❌ ไม่ครอบเลย</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left whitespace-nowrap">งวด</th>
                <th className="px-3 py-2 text-center whitespace-nowrap">ผลล่าง</th>
                {result.formulas.map((f) => (
                  <th key={f.idx} className="px-2 py-2 text-center text-[10px]">#{f.idx}</th>
                ))}
                <th className="px-3 py-2 text-center whitespace-nowrap">ถูก/12</th>
              </tr>
            </thead>
            <tbody>
              {result.history.map((row, ri) => (
                <tr key={ri} className="border-t border-ink/5 hover:bg-violet-50/30">
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium text-ink/60 whitespace-nowrap">{row.date}</td>
                  <td className="px-3 py-1.5 text-center">
                    <span className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 px-2 py-0.5 font-black text-ink text-sm">{row.bottom}</span>
                  </td>
                  {row.results.map((r, fi) => (
                    <td key={fi} className="px-2 py-1.5 text-center">
                      {r.pass ? <span className="text-base">✅</span> : <span className="text-base opacity-25">❌</span>}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-center">
                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${row.passCount >= 10 ? "bg-emerald-100 text-emerald-700" : row.passCount >= 7 ? "bg-blue-100 text-blue-700" : row.passCount >= 4 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                      {row.passCount}/12
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Tool040Featured7() {
  return (
    <ToolShell
      title="40. สูตรเด่นเจ็ดตัว"
      desc="12 สูตร — เลขเรียงต่อเนื่อง 7 ตัว (ไม่ข้าม, วนรอบ 0-9) | ถูก = สองตัวล่างครอบ 1-2 ตัว | สถิติ 25 งวด"
    >
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = useMemo(() => compute(data), [data]);
        return (
          <div className="space-y-5">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result ? (
              <Results result={result} showToast={showToast} />
            ) : (
              <div className="rounded-xl bg-violet-50 p-6 text-center text-sm text-ink/50">
                ⏳ ต้องการข้อมูลอย่างน้อย 5 งวด (แนะนำ 25 งวดขึ้นไป)
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
