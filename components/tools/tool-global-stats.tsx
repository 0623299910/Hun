"use client";
import { useState, useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry } from "@/lib/data-parser";

interface DigitStat { num: number; count: number; lastIndex: number; gap: number }

function calcDigitStats(data: ParsedEntry[], keyFn: (e: ParsedEntry) => number): DigitStat[] {
  const total = data.length;
  const res: DigitStat[] = Array.from({ length: 10 }, (_, i) => ({ num: i, count: 0, lastIndex: -1, gap: total }));
  data.forEach((item, idx) => {
    const val = keyFn(item);
    res[val].count++;
    res[val].lastIndex = idx;
  });
  res.forEach((item) => { if (item.lastIndex !== -1) item.gap = total - 1 - item.lastIndex; });
  return res;
}

function DigitStatTable({ title, data, color }: { title: string; data: DigitStat[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b bg-gray-50 p-3">
        <h3 className={`font-bold text-${color}-600`}>📊 {title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase">
            <tr><th className="px-4 py-2">เลข</th><th className="px-4 py-2 text-left w-1/2">ความถี่</th><th className="px-4 py-2">มาแล้ว</th><th className="px-4 py-2 text-red-500">หายไป</th></tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr key={item.num} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-lg font-bold">{item.num}</td>
                <td className="px-4 py-2 text-left">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${item.count / max > 0.8 ? "bg-green-500" : item.count / max > 0.4 ? "bg-blue-500" : "bg-gray-300"}`}
                      style={{ width: `${(item.count / max) * 100}%` }} />
                  </div>
                </td>
                <td className="px-4 py-2 font-bold text-gray-700">{item.count}</td>
                <td className="px-4 py-2">
                  {item.gap > 20 ? <span className="rounded bg-red-100 px-2 py-0.5 font-bold text-red-700">{item.gap}</span> : <span className="text-gray-500">{item.gap}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ToolGlobalStats() {
  const [activeTab, setActiveTab] = useState<"tens" | "units" | "sum" | "missing">("tens");

  return (
    <ToolShell title="สถิติรวม" minEntries={2}>
      {({ data, localInput, setLocalInput }) => {
        const stats = useMemo(() => {
          if (data.length < 2) return null;
          const tens = calcDigitStats(data, (e) => parseInt(e.bottom[0]));
          const units = calcDigitStats(data, (e) => parseInt(e.bottom[1]));
          const sums = calcDigitStats(data, (e) => (parseInt(e.bottom[0]) + parseInt(e.bottom[1])) % 10);

          const last5 = data.slice(-5).map((e) => (parseInt(e.bottom[0]) + parseInt(e.bottom[1])) % 10);
          const sumFlow = last5.map((s) => (s % 2 === 0 ? "คู่" : "คี่"));

          const foundPairs = new Set(data.map((e) => e.bottom));
          const missingPairs: string[] = [];
          for (let i = 0; i < 100; i++) {
            const p = i.toString().padStart(2, "0");
            if (!foundPairs.has(p)) missingPairs.push(p);
          }

          return { tens, units, sums, last5, sumFlow, missingPairs, totalDraws: data.length };
        }, [data]);

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {stats && (
              <div className="space-y-4 animate-[fadeIn_0.3s]">
                {/* Header */}
                <div className="flex items-center justify-between rounded-2xl border-l-4 border-gray-700 bg-white p-4 shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold text-ink">ผลวิเคราะห์สถิติ</h2>
                    <p className="text-xs text-ink/50">ฐานข้อมูล: <span className="font-bold text-indigo-600">{stats.totalDraws}</span> งวดล่าสุด</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-2xl bg-white p-1.5 shadow-sm border">
                  {([
                    { id: "tens" as const, label: "หลักสิบ" },
                    { id: "units" as const, label: "หลักหน่วย" },
                    { id: "sum" as const, label: "แต้มล่าง" },
                    { id: "missing" as const, label: "คู่ยังไม่ออก" },
                  ]).map((t) => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className={`flex-1 whitespace-nowrap rounded-xl py-2.5 px-2 text-sm font-bold transition ${activeTab === t.id ? "bg-gray-800 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                {activeTab === "tens" && <DigitStatTable title="สถิติหลักสิบ (Tens)" data={stats.tens} color="blue" />}
                {activeTab === "units" && <DigitStatTable title="สถิติหลักหน่วย (Units)" data={stats.units} color="pink" />}

                {activeTab === "sum" && (
                  <div className="space-y-4">
                    {/* Sum flow */}
                    <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white shadow-lg">
                      <h3 className="mb-4 text-lg font-bold">⚡ การไหลของแต้ม (5 งวดล่าสุด)</h3>
                      <div className="flex justify-between rounded-xl bg-white/10 p-4">
                        {stats.last5.map((sum, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div className="text-[10px] opacity-70 mb-1">งวดที่ {i + 1}</div>
                            <div className="text-2xl font-black">{sum}</div>
                            <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] ${sum % 2 === 0 ? "bg-green-400 text-green-900" : "bg-orange-400 text-orange-900"}`}>
                              {stats.sumFlow[i]}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-lg bg-black/20 p-2 text-center text-sm">
                        แนวโน้ม: <span className="font-bold text-yellow-300">{stats.sumFlow[stats.sumFlow.length - 1]}</span>
                      </div>
                    </div>
                    <DigitStatTable title="สถิติแต้มล่าง (Sum)" data={stats.sums} color="violet" />
                  </div>
                )}

                {activeTab === "missing" && (
                  <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-bold text-ink">คู่ที่ยังไม่เคยออก ({stats.missingPairs.length} คู่)</h3>
                      <span className="text-xs text-ink/40">จาก {stats.totalDraws} งวด</span>
                    </div>
                    {stats.missingPairs.length > 0 ? (
                      <div className="grid grid-cols-5 gap-3 sm:grid-cols-8 md:grid-cols-10">
                        {stats.missingPairs.map((pair) => (
                          <div key={pair} className="rounded-lg border border-red-100 bg-red-50 py-2 text-center text-lg font-bold text-red-600 shadow-sm transition hover:scale-105">
                            {pair}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-green-100 bg-green-50 py-10 text-center font-bold text-green-500">
                        ✅ สุดยอด! เลขออกครบทุกคู่แล้ว 00-99
                      </div>
                    )}
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
