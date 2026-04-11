"use client";
import { useMemo, useState } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

type FormulaResult = { id: number; next: string; pass: number; fail: number; history: { date: string; bot: string; pred: string; ok: boolean }[] };

function calcFormula(id: number, data: ParsedEntry[]): FormulaResult {
  const res: FormulaResult = { id, next: "--", pass: 0, fail: 0, history: [] };
  if (data.length < 3) return res;

  const computePair = (idx: number): string => {
    const l = data[idx];
    const p1 = data[idx - 1];
    const p2 = idx >= 2 ? data[idx - 2] : p1;
    try {
      switch (id) {
        case 1: return "" + d(l.top, 2) + d(l.bottom, 1);
        case 2: return "" + mod10(d(l.top, 0) - 1) + mod10(d(l.top, 0) - 2);
        case 3: return "" + d(l.top, 1) + mod10(d(l.top, 1) - 1);
        case 4: return "" + mod10(d(l.top, 1) + d(l.top, 2)) + d(l.bottom, 0);
        case 5: return "" + mod10(d(l.top, 0) - 1) + mod10(d(l.bottom, 1) - 1);
        case 6: return "" + mod10(d(p1.top, 0) + d(l.top, 0)) + mod10(d(p1.top, 1) + d(l.top, 1));
        case 7: return "" + d(p2.top, 0) + d(l.top, 0);
        case 8: return "" + mod10(d(l.top, 1) - 1) + mod10(d(l.bottom, 0) - 1);
        case 9: return "" + mod10(d(l.bottom, 0) + 2) + mod10(d(l.bottom, 1) + 2);
        case 10: return "" + mod10(d(l.bottom, 0) + 5) + d(l.bottom, 1);
        default: return "--";
      }
    } catch { return "--"; }
  };

  res.next = computePair(data.length - 1);

  for (let i = Math.min(data.length - 1, 20); i >= 1; i--) {
    const pred = computePair(i - 1);
    if (pred === "--") continue;
    const actual = data[i].bottom;
    const ok = pred !== actual;
    if (ok) res.pass++; else res.fail++;
    res.history.push({ date: data[i].date, bot: actual, pred, ok });
  }

  return res;
}

export default function Tool008CrossPolarity() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <ToolShell title="คู่ข้ามขั้ว" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const allResults = Array.from({ length: 10 }, (_, i) => calcFormula(i + 1, data));
        const active = allResults[activeTab];
        const allText = allResults.map((r) => r.next).join("  ");

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {data.length >= 3 && (
              <div className="space-y-4 animate-[fadeIn_0.5s]">
                {/* Summary */}
                <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                  {allResults.map((r, i) => (
                    <button key={i} onClick={() => setActiveTab(i)}
                      className={`rounded-lg py-2 text-center text-sm font-bold transition ${i === activeTab ? "bg-ink text-white shadow-lg" : "border border-ink/10 bg-white text-ink hover:bg-gray-50"}`}>
                      <div className="text-[10px] text-ink/40">ส.{r.id}</div>
                      <div className={`text-lg ${i === activeTab ? "text-yellow-300" : "text-ink"}`}>{r.next}</div>
                    </button>
                  ))}
                </div>

                <button onClick={() => { copyText(allText); showToast("คัดลอก 10 สูตร"); }}
                  className="w-full rounded-xl bg-blue-500 py-3 font-bold text-white shadow transition hover:bg-blue-600">
                  📋 คัดลอกทั้งหมด
                </button>

                {/* Active formula detail */}
                {active && (
                  <div className="rounded-xl border border-ink/10 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">สูตร {active.id}</h3>
                        <div className="flex gap-2 text-xs">
                          <span className="rounded bg-green-100 px-2 py-0.5 font-bold text-green-700">ผ่าน {active.pass}</span>
                          <span className="rounded bg-red-100 px-2 py-0.5 font-bold text-red-700">หลุด {active.fail}</span>
                          <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-700">
                            {active.pass + active.fail > 0 ? ((active.pass / (active.pass + active.fail)) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="text-3xl font-black text-red-600">{active.next}</div>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-ink/10">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-gray-50 text-center font-bold">
                            <th className="p-2">งวด</th><th className="p-2">ผลออก</th><th className="p-2 bg-red-50 text-red-700">ดับ</th><th className="p-2">ผล</th>
                          </tr>
                        </thead>
                        <tbody>
                          {active.history.slice(0, 15).map((h, i) => (
                            <tr key={i} className="border-b text-center hover:bg-gray-50">
                              <td className="p-2">{h.date}</td>
                              <td className="p-2 font-bold">{h.bot}</td>
                              <td className="p-2 font-bold text-red-600">{h.pred}</td>
                              <td className={`p-2 font-bold ${h.ok ? "text-green-600" : "text-red-600"}`}>{h.ok ? "✅ ผ่าน" : "❌ หลุด"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
