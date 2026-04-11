"use client";
import { useState, useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

function generateSeq(startVal: number): number[] {
  return Array.from({ length: 7 }, (_, i) => mod10(startVal + i));
}

const FORMULA_DEFS = [
  { id: 1,  name: "ร้อย+5 เดินหน้า",      calc: (h: number, t: number, u: number) => h + 5 },
  { id: 2,  name: "สิบ+3 เดินหน้า",       calc: (h: number, t: number, u: number) => t + 3 },
  { id: 3,  name: "หน่วย+7 เดินหน้า",      calc: (h: number, t: number, u: number) => u + 7 },
  { id: 4,  name: "ร้อย+สิบ เดินหน้า",     calc: (h: number, t: number, u: number) => h + t },
  { id: 5,  name: "สิบ+หน่วย เดินหน้า",    calc: (h: number, t: number, u: number) => t + u },
  { id: 6,  name: "ร้อย+สิบ+หน่วย เดินหน้า", calc: (h: number, t: number, u: number) => h + t + u },
  { id: 7,  name: "ร้อย-สิบ เดินหน้า",     calc: (h: number, t: number, u: number) => h - t + 10 },
  { id: 8,  name: "สิบ-หน่วย เดินหน้า",    calc: (h: number, t: number, u: number) => t - u + 10 },
  { id: 9,  name: "ร้อย×2 เดินหน้า",      calc: (h: number, t: number, u: number) => h * 2 },
  { id: 10, name: "สิบ×2 เดินหน้า",       calc: (h: number, t: number, u: number) => t * 2 },
  { id: 11, name: "หน่วย×2 เดินหน้า",      calc: (h: number, t: number, u: number) => u * 2 },
  { id: 12, name: "ร้อย+3 เดินหน้า",      calc: (h: number, t: number, u: number) => h + 3 },
  { id: 13, name: "สิบ+7 เดินหน้า",       calc: (h: number, t: number, u: number) => t + 7 },
  { id: 14, name: "หน่วย+5 เดินหน้า",      calc: (h: number, t: number, u: number) => u + 5 },
  { id: 15, name: "ร้อย-หน่วย เดินหน้า",   calc: (h: number, t: number, u: number) => h - u + 10 },
];

function checkMatch(nums: number[], bot: string) {
  const t = parseInt(bot[0]), u = parseInt(bot[1]);
  const mt = nums.includes(t), mu = nums.includes(u);
  return { matched: mt || mu, count: (mt ? 1 : 0) + (mu ? 1 : 0) };
}

function calcFormulas(top: string) {
  const h = d(top, 0), t = d(top, 1), u = d(top, 2);
  return FORMULA_DEFS.map((f) => ({
    id: f.id,
    name: f.name,
    numbers: generateSeq(f.calc(h, t, u)),
  }));
}

export default function Tool015SevenWayTwo() {
  const [activeTab, setActiveTab] = useState<"result" | "stats">("result");

  return (
    <ToolShell title="ทางเลข 7 ตัว (สอง)" minEntries={2}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const last = data.length > 0 ? data[data.length - 1] : null;
        const currentFormulas = useMemo(() => (last ? calcFormulas(last.top) : []), [last]);

        /* stats: check last 20 consecutive pairs */
        const stats = useMemo(() => {
          if (data.length < 3) return [];
          const checks = Math.min(20, data.length - 1);
          return FORMULA_DEFS.map((fDef) => {
            let hits = 0, twoHits = 0;
            for (let i = 0; i < checks; i++) {
              const idx = data.length - 2 - i;
              if (idx < 0) break;
              const prev = data[idx];
              const next = data[idx + 1];
              const fResults = calcFormulas(prev.top);
              const fRes = fResults.find((f) => f.id === fDef.id)!;
              const match = checkMatch(fRes.numbers, next.bottom);
              if (match.matched) hits++;
              if (match.count === 2) twoHits++;
            }
            return { id: fDef.id, name: fDef.name, hits, twoHits, total: checks };
          }).sort((a, b) => b.hits - a.hits || b.twoHits - a.twoHits);
        }, [data]);

        /* frequency analysis of first digits */
        const firstDigitFreq = useMemo(() => {
          if (!currentFormulas.length) return [];
          const freq = Array(10).fill(0);
          currentFormulas.forEach((f) => freq[f.numbers[0]]++);
          return freq.map((c, i) => ({ digit: i, count: c })).filter((x) => x.count > 0).sort((a, b) => b.count - a.count);
        }, [currentFormulas]);

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {last && (
              <div className="space-y-4 animate-[fadeIn_0.3s]">
                <div className="text-xs text-ink/50">จากเลข 3 ตัวบน: <span className="font-bold text-ink">{last.top}</span> (งวด {last.date})</div>

                {/* Tabs */}
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab("result")} className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${activeTab === "result" ? "bg-ink text-white" : "bg-ink/10 text-ink/60"}`}>
                    ผลลัพธ์ 15 สูตร
                  </button>
                  <button onClick={() => setActiveTab("stats")} className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${activeTab === "stats" ? "bg-ink text-white" : "bg-ink/10 text-ink/60"}`}>
                    สถิติความแม่น
                  </button>
                </div>

                {activeTab === "result" && (
                  <div className="space-y-3">
                    {/* First-digit frequency */}
                    {firstDigitFreq.length > 0 && (
                      <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                        <h4 className="mb-1 text-xs font-bold text-purple-700">ตัวเลขตั้งต้นที่มาบ่อย</h4>
                        <div className="flex gap-2">
                          {firstDigitFreq.map((f, i) => (
                            <span key={f.digit} className={`rounded-full px-2 py-0.5 text-xs font-bold ${i === 0 ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700"}`}>
                              {f.digit} ({f.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Formula results */}
                    {currentFormulas.map((f) => (
                      <div key={f.id} className="rounded-xl border border-ink/10 bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-ink/70">สูตร {f.id}: {f.name}</span>
                          <button onClick={() => { copyText(f.numbers.join(" ")); showToast(`คัดลอกสูตร ${f.id}`); }} className="text-[10px] text-blue-600 hover:underline">📋</button>
                        </div>
                        <div className="flex gap-2">
                          {f.numbers.map((n, i) => (
                            <span key={i} className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 text-base font-bold border border-indigo-200">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "stats" && stats.length > 0 && (
                  <div className="overflow-auto rounded-lg border" style={{ maxHeight: 500 }}>
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr className="border-b font-bold text-center">
                          <th className="p-2">#</th><th className="p-2 text-left">สูตร</th><th className="p-2">ถูก</th><th className="p-2">ถูก 2 ตัว</th><th className="p-2">ทั้งหมด</th><th className="p-2">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((s, i) => (
                          <tr key={s.id} className={`border-b text-center hover:bg-gray-50 ${i < 3 ? "bg-green-50" : ""}`}>
                            <td className="p-2 font-bold">{s.id}</td>
                            <td className="p-2 text-left">{s.name}</td>
                            <td className="p-2 font-bold text-green-600">{s.hits}</td>
                            <td className="p-2 font-bold text-blue-600">{s.twoHits}</td>
                            <td className="p-2">{s.total}</td>
                            <td className="p-2 font-bold">{s.total > 0 ? ((s.hits / s.total) * 100).toFixed(0) : 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
