"use client";
import { useState, useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, copyText } from "@/lib/data-parser";

const DAYS_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const DAY_COLORS = ["bg-red-500", "bg-yellow-400", "bg-pink-400", "bg-green-500", "bg-orange-400", "bg-blue-400", "bg-purple-500"];

function findLeast(freq: number[]) {
  const min = Math.min(...freq);
  return freq.map((f, i) => ({ digit: i, count: f })).filter((x) => x.count === min);
}

export default function Tool016Overview() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [tab, setTab] = useState<"analyze" | "export">("analyze");

  return (
    <ToolShell title="สรุปภาพรวม" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        /* parse raw data with day info */
        const rawData = useMemo(() => data.map((e) => ({
          ...e, dayIndex: new Date(e.date).getDay(),
        })), [data]);

        /* global dead pairs */
        const globalDeadPairs = useMemo(() => {
          const seen = new Set(data.map((e) => e.bottom));
          const dead: string[] = [];
          for (let i = 0; i < 100; i++) {
            const p = i.toString().padStart(2, "0");
            if (!seen.has(p)) dead.push(p);
          }
          return dead;
        }, [data]);

        /* daily stats */
        const stats = useMemo(() => {
          const dayData = rawData.filter((d) => d.dayIndex === selectedDay);
          if (dayData.length === 0) return null;

          const tensFreq = Array(10).fill(0);
          const unitsFreq = Array(10).fill(0);
          const sumFreq = Array(10).fill(0);
          const allFreq = Array(10).fill(0);

          dayData.forEach((item) => {
            const t = parseInt(item.bottom[0]), u = parseInt(item.bottom[1]);
            const s = (t + u) % 10;
            tensFreq[t]++; unitsFreq[u]++; sumFreq[s]++;
            allFreq[t]++; allFreq[u]++;
          });

          const lucky7 = allFreq.map((f, i) => ({ d: i, f })).sort((a, b) => b.f - a.f).slice(0, 7).map((o) => o.d).sort((a, b) => a - b);
          const deadTens = findLeast(tensFreq);
          const deadUnits = findLeast(unitsFreq);
          const deadSums = findLeast(sumFreq);

          /* backtest */
          let perfL7 = 0, perfDT = 0, perfDU = 0, perfDS = 0;
          const history = dayData.map((d) => {
            const t = parseInt(d.bottom[0]), u = parseInt(d.bottom[1]), s = (t + u) % 10;
            const isL7 = lucky7.includes(t) || lucky7.includes(u);
            const isDT = !deadTens.some((x) => x.digit === t);
            const isDU = !deadUnits.some((x) => x.digit === u);
            const isDS = !deadSums.some((x) => x.digit === s);
            if (isL7) perfL7++;
            if (isDT) perfDT++;
            if (isDU) perfDU++;
            if (isDS) perfDS++;
            return { ...d, isL7, isDT, isDU, isDS };
          });

          return { lucky7, deadTens, deadUnits, deadSums, total: dayData.length, perfL7, perfDT, perfDU, perfDS, history };
        }, [rawData, selectedDay]);

        /* export text */
        const exportText = useMemo(() => {
          if (!stats) return `ยังไม่มีข้อมูลสำหรับวัน${DAYS_TH[selectedDay]}`;
          const pL7 = ((stats.perfL7 / stats.total) * 100).toFixed(0);
          const pDT = ((stats.perfDT / stats.total) * 100).toFixed(0);
          const pDU = ((stats.perfDU / stats.total) * 100).toFixed(0);
          const pDS = ((stats.perfDS / stats.total) * 100).toFixed(0);
          return `📅 สรุปหุ้น/หวย วัน${DAYS_TH[selectedDay]}\n(สถิติย้อนหลัง ${stats.total} รอบ)\n\n✅ วิน 7 ตัว: ${stats.lucky7.join("")} (มา 1-2 ตัว: ${pL7}%)\n-------------------------\n⛔ ดับสิบ: ${stats.deadTens.map((x) => x.digit).join("")||"-"} (${pDT}%)\n⛔ ดับหน่วย: ${stats.deadUnits.map((x) => x.digit).join("")||"-"} (${pDU}%)\n⛔ แต้มดับ: ${stats.deadSums.map((x) => x.digit).join("")||"-"} (${pDS}%)\n-------------------------\n💀 คู่ดับ (จาก ${data.length} งวด):\n${globalDeadPairs.slice(0, 10).join(" ")}${globalDeadPairs.length > 10 ? "..." : ""}`;
        }, [stats, selectedDay, data.length, globalDeadPairs]);

        const pctBar = (correct: number, total: number) => {
          const pct = total > 0 ? (correct / total) * 100 : 0;
          return (
            <div className="rounded-lg border bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-ink/70">{correct === stats?.perfL7 ? "วิน 7 ตัว" : correct === stats?.perfDT ? "ดับสิบ" : correct === stats?.perfDU ? "ดับหน่วย" : "แต้มดับ"}</span>
                <span className={`font-bold ${pct >= 90 ? "text-green-600" : "text-orange-600"}`}>{pct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-orange-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-ink/40">
                <span>ถูก {correct}</span><span>ผิด {total - correct}</span>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {data.length > 0 && (
              <div className="space-y-4 animate-[fadeIn_0.3s]">
                {/* Tabs */}
                <div className="flex rounded-xl bg-ink/5 p-1">
                  <button onClick={() => setTab("analyze")} className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${tab === "analyze" ? "bg-white text-ink shadow" : "text-ink/50"}`}>
                    วิเคราะห์
                  </button>
                  <button onClick={() => setTab("export")} className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${tab === "export" ? "bg-white text-ink shadow" : "text-ink/50"}`}>
                    GoodNotes
                  </button>
                </div>

                {/* Day selector */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {DAYS_TH.map((name, i) => (
                    <button key={i} onClick={() => setSelectedDay(i)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition ${selectedDay === i ? `${DAY_COLORS[i]} text-white shadow` : "bg-white border border-ink/10 text-ink/50"}`}>
                      {name}
                    </button>
                  ))}
                </div>

                {tab === "analyze" && (
                  <>
                    {!stats ? (
                      <div className="rounded-xl bg-white p-8 text-center text-ink/50">ไม่มีข้อมูลของวัน{DAYS_TH[selectedDay]}</div>
                    ) : (
                      <div className="space-y-4">
                        {/* Dashboard */}
                        <div className="grid grid-cols-2 gap-3">
                          {pctBar(stats.perfL7, stats.total)}
                          {pctBar(stats.perfDT, stats.total)}
                          {pctBar(stats.perfDU, stats.total)}
                          {pctBar(stats.perfDS, stats.total)}
                        </div>

                        {/* Lucky 7 */}
                        <div className="rounded-xl border bg-white p-4 shadow-sm">
                          <h3 className="mb-2 font-bold text-ink">✨ เลขวิน 7 ตัว</h3>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {stats.lucky7.map((n) => (
                              <div key={n} className={`flex h-10 w-10 items-center justify-center rounded-full ${DAY_COLORS[selectedDay]} text-white text-xl font-bold shadow`}>{n}</div>
                            ))}
                          </div>
                        </div>

                        {/* Dead digits */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border border-red-100 bg-white p-3 text-center shadow-sm">
                            <h3 className="text-xs font-bold text-ink/50 mb-1">ดับสิบ</h3>
                            <div className="text-2xl font-black text-red-500">{stats.deadTens.map((x) => x.digit).join(" - ") || "-"}</div>
                          </div>
                          <div className="rounded-lg border border-red-100 bg-white p-3 text-center shadow-sm">
                            <h3 className="text-xs font-bold text-ink/50 mb-1">ดับหน่วย</h3>
                            <div className="text-2xl font-black text-red-500">{stats.deadUnits.map((x) => x.digit).join(" - ") || "-"}</div>
                          </div>
                        </div>

                        {/* Dead sums */}
                        <div className="flex items-center justify-between rounded-lg border bg-white p-3 px-6 shadow-sm">
                          <h3 className="text-sm font-bold text-ink/50">แต้มดับ</h3>
                          <div className="flex gap-2 text-xl font-black text-ink">
                            {stats.deadSums.map((x) => (
                              <span key={x.digit} className="flex h-8 w-8 items-center justify-center rounded bg-ink/5">{x.digit}</span>
                            ))}
                          </div>
                        </div>

                        {/* History */}
                        <div className="overflow-auto rounded-lg border" style={{ maxHeight: 320 }}>
                          <table className="w-full text-[11px]">
                            <thead className="sticky top-0 bg-gray-50"><tr className="border-b font-bold text-center">
                              <th className="p-1.5">วันที่</th><th className="p-1.5">ออก</th><th className="p-1.5">วิน</th><th className="p-1.5">ดับส.</th><th className="p-1.5">ดับน.</th><th className="p-1.5">แต้ม</th>
                            </tr></thead>
                            <tbody>{stats.history.map((r, i) => (
                              <tr key={i} className="border-b text-center hover:bg-gray-50">
                                <td className="p-1.5 text-[10px]">{r.date}</td>
                                <td className="p-1.5 font-bold">{r.bottom}</td>
                                <td className="p-1.5">{r.isL7 ? "🟢" : "❌"}</td>
                                <td className="p-1.5">{r.isDT ? "🟢" : "❌"}</td>
                                <td className="p-1.5">{r.isDU ? "🟢" : "❌"}</td>
                                <td className="p-1.5">{r.isDS ? "🟢" : "❌"}</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>

                        {/* Global dead pairs */}
                        <div className="rounded-xl bg-ink p-4 text-white">
                          <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
                            <h3 className="font-bold text-sm">💀 คู่ดับ (ไม่เคยมาเลย)</h3>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">{data.length} งวด</span>
                          </div>
                          <p className="text-xs font-mono text-white/70 leading-relaxed max-h-24 overflow-auto">
                            {globalDeadPairs.length > 0 ? globalDeadPairs.join("  ") : "ไม่มีคู่ดับ (ออกมาครบแล้วทุกคู่)"}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {tab === "export" && (
                  <div className="rounded-xl border bg-white p-6 shadow-sm text-center">
                    <h2 className="text-lg font-bold text-ink mb-1">คัดลอกสรุปผล</h2>
                    <p className="text-xs text-ink/40 mb-4">สำหรับ GoodNotes / Line / Notes</p>
                    <textarea readOnly value={exportText} className="w-full h-52 rounded-xl border bg-gray-50 p-4 font-mono text-sm text-ink resize-none" />
                    <button onClick={() => { copyText(exportText); showToast("คัดลอกเรียบร้อย"); }}
                      className="mt-3 rounded-xl bg-ink px-6 py-3 font-bold text-white shadow hover:bg-ink/80 transition">
                      📋 คัดลอก
                    </button>
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
