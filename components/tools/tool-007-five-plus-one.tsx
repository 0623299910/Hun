"use client";
import { useMemo, useState } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, copyText } from "@/lib/data-parser";

type Counts = { digit: number; count: number }[];
const getCounts = (data: ParsedEntry[], limit?: number): Counts => {
  const counts = Array(10).fill(0);
  const sliced = limit ? data.slice(-limit) : data;
  sliced.forEach((dd) => { counts[parseInt(dd.bottom[0])]++; counts[parseInt(dd.bottom[1])]++; });
  return counts.map((c, i) => ({ digit: i, count: c })).sort((a, b) => b.count - a.count);
};
const checkWin = (bot2: string, predicted: number[]) => {
  return predicted.includes(parseInt(bot2[0])) || predicted.includes(parseInt(bot2[1]));
};
const getMissing = (seven: number[]) => [0,1,2,3,4,5,6,7,8,9].filter((d) => !seven.includes(d));

const formulas = [
  { name: "กระแสปัจจุบัน", fn: (data: ParsedEntry[]) => getCounts(data, 10).slice(0, 7).map((x) => x.digit) },
  { name: "เจ้าสถิติ", fn: (data: ParsedEntry[]) => getCounts(data).slice(0, 7).map((x) => x.digit) },
  { name: "หลักสิบ", fn: (data: ParsedEntry[]) => {
    const c = Array(10).fill(0); const s = data.length > 20 ? data.slice(-20) : data;
    s.forEach((dd) => c[parseInt(dd.bottom[0])]++);
    return c.map((cc, i) => ({ d: i, c: cc })).sort((a, b) => b.c - a.c).slice(0, 7).map((x) => x.d);
  }},
  { name: "หลักหน่วย", fn: (data: ParsedEntry[]) => {
    const c = Array(10).fill(0); const s = data.length > 20 ? data.slice(-20) : data;
    s.forEach((dd) => c[parseInt(dd.bottom[1])]++);
    return c.map((cc, i) => ({ d: i, c: cc })).sort((a, b) => b.c - a.c).slice(0, 7).map((x) => x.d);
  }},
  { name: "เลขตาม", fn: (data: ParsedEntry[]) => {
    if (data.length < 2) return [0,1,2,3,4,5,6];
    const prev = data[data.length - 1].bottom;
    const history = data.slice(0, -1); const counts = Array(10).fill(0);
    const p1 = parseInt(prev[0]), p2 = parseInt(prev[1]);
    history.forEach((h, i) => {
      if (i < history.length - 1) {
        const c1 = parseInt(h.bottom[0]), c2 = parseInt(h.bottom[1]);
        if (c1 === p1 || c1 === p2 || c2 === p1 || c2 === p2) {
          const next = history[i + 1]; counts[parseInt(next.bottom[0])]++; counts[parseInt(next.bottom[1])]++;
        }
      }
    });
    return counts.map((c, i) => ({ d: i, c })).sort((a, b) => b.c - a.c).slice(0, 7).map((x) => x.d);
  }},
];

const calcAccuracy = (data: ParsedEntry[], logicFn: (d: ParsedEntry[]) => number[]) => {
  let hits = 0;
  const history: { date: string; actual: string; predicted: number[]; win: boolean }[] = [];
  const checks = Math.min(10, Math.floor(data.length / 2));
  for (let i = 0; i < checks; i++) {
    const idx = data.length - 1 - i;
    const known = data.slice(0, idx);
    const target = data[idx];
    const predicted = logicFn(known);
    const win = checkWin(target.bottom, predicted);
    if (win) hits++;
    history.push({ date: target.date, actual: target.bottom, predicted, win });
  }
  return { score: hits, total: checks, history };
};

export default function Tool007FivePlusOne() {
  const [activeFormula, setActiveFormula] = useState(0);
  return (
    <ToolShell title="ดับ5คู่บวก1" minEntries={10}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const results = formulas.map((f) => {
          const digits = f.fn(data).sort((a, b) => a - b);
          const missing = getMissing(digits).sort((a, b) => a - b);
          const perf = calcAccuracy(data, f.fn);
          return { ...f, digits, missing, perf };
        });
        const perfectOnly = results.filter((r) => r.perf.score === r.perf.total && r.perf.total > 0);
        const display = perfectOnly.length > 0 ? perfectOnly : results;
        const active = display[activeFormula] || display[0];
        if (!active) return <DataInput value={localInput} onChange={setLocalInput} />;

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {data.length >= 10 && (
              <div className="space-y-4 animate-[fadeIn_0.5s]">
                {/* Formula selector */}
                <div className="flex flex-wrap gap-2">
                  {display.map((r, i) => (
                    <button key={i} onClick={() => setActiveFormula(i)}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${i === activeFormula ? "bg-ink text-white" : "bg-white text-ink border border-ink/20 hover:bg-gray-100"}`}>
                      {r.name} ({r.perf.score}/{r.perf.total})
                    </button>
                  ))}
                </div>

                {/* Cut display */}
                <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center">
                  <div className="mb-1 text-xs font-bold uppercase text-red-400">✂️ ตัดออก (3 ตัว)</div>
                  <div className="flex justify-center gap-6">
                    {active.missing.map((dd) => (
                      <span key={dd} className="text-5xl font-black text-red-600">{dd}</span>
                    ))}
                  </div>
                </div>

                {/* 7 digits display */}
                <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
                  <div className="mb-1 text-xs font-bold uppercase text-green-400">✅ 7 ตัวเลขแนะนำ</div>
                  <div className="flex justify-center gap-4">
                    {active.digits.map((dd) => (
                      <span key={dd} className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-xl font-bold text-white shadow">{dd}</span>
                    ))}
                  </div>
                </div>

                <button onClick={() => {
                  const text = active.missing.join(" ");
                  copyText(text); showToast("คัดลอก: " + text);
                }} className="w-full rounded-xl bg-blue-500 py-3 font-bold text-white shadow transition hover:bg-blue-600">
                  📋 คัดลอกเลขตัด
                </button>

                {/* Backtest */}
                <div className="overflow-hidden rounded-lg border border-ink/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-center font-bold">
                        <th className="p-2">วันที่</th><th className="p-2">ผลออก</th><th className="p-2">ทำนาย 7 ตัว</th><th className="p-2">ผล</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.perf.history.map((h, i) => (
                        <tr key={i} className="border-b text-center hover:bg-gray-50">
                          <td className="p-2">{h.date}</td>
                          <td className="p-2 font-bold">{h.actual}</td>
                          <td className="p-2">{h.predicted.sort((a,b)=>a-b).join(" ")}</td>
                          <td className={`p-2 font-bold ${h.win ? "text-green-600" : "text-red-600"}`}>{h.win ? "✅" : "❌"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
