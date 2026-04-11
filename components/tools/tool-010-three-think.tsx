"use client";
import { useMemo, useState } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

function compute(data: ParsedEntry[]) {
  if (data.length < 4) return null;

  // Formula 1: top[last-3].slice(-1) + bottom[last-1].slice(-1)
  const f1History: { date: string; bot: string; d1: string; d2: string; hit: boolean }[] = [];
  for (let i = 3; i < data.length; i++) {
    const d1 = data[i - 3].top.slice(-1);
    const d2 = data[i - 1].bottom.slice(-1);
    const actual = data[i].bottom;
    const hit = actual.includes(d1) && actual.includes(d2);
    f1History.push({ date: data[i].date, bot: actual, d1, d2, hit });
  }
  const f1Pred = { d1: data[data.length - 3].top.slice(-1), d2: data[data.length - 1].bottom.slice(-1) };

  // Formula 2: (top[0]-1)%10 + (top[2]-1)%10
  const f2History: { date: string; bot: string; d1: number; d2: number; hit: boolean }[] = [];
  for (let i = 0; i < data.length - 1; i++) {
    const dd1 = mod10(d(data[i].top, 0) - 1);
    const dd2 = mod10(d(data[i].top, 2) - 1);
    const actual = data[i + 1].bottom;
    const hit = actual.includes(String(dd1)) && actual.includes(String(dd2));
    f2History.push({ date: data[i + 1].date, bot: actual, d1: dd1, d2: dd2, hit });
  }
  const last = data[data.length - 1];
  const f2Pred = { d1: mod10(d(last.top, 0) - 1), d2: mod10(d(last.top, 2) - 1) };

  // Formula 3: Z-Score dead numbers
  const stats = Array.from({ length: 10 }, (_, i) => ({ num: i, count: 0, lastIndex: -1, gap: 0, zScore: 0, finalScore: 0 }));
  data.forEach((draw, idx) => {
    for (const ch of draw.bottom) { const dd = parseInt(ch); stats[dd].count++; stats[dd].lastIndex = idx; }
  });
  stats.forEach((s) => { s.gap = s.lastIndex === -1 ? data.length : data.length - 1 - s.lastIndex; });
  const counts = stats.map((s) => s.count);
  const mean = counts.reduce((a, b) => a + b, 0) / 10;
  const stdDev = Math.sqrt(counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 10);
  const lastBot = data[data.length - 1].bottom;
  stats.forEach((s) => {
    s.zScore = stdDev === 0 ? 0 : (s.count - mean) / stdDev;
    const recency = lastBot.includes(String(s.num)) ? 20 : 0;
    s.finalScore = s.zScore * 15 + s.gap * 5 + recency;
  });
  stats.sort((a, b) => b.finalScore - a.finalScore);

  return {
    f1: { pred: f1Pred, history: f1History.reverse() },
    f2: { pred: f2Pred, history: f2History.reverse() },
    f3: { dead: [stats[0], stats[1]], stats },
    text: `${f1Pred.d1}${f1Pred.d2}  ${f2Pred.d1}${f2Pred.d2}  ดับ${stats[0].num},${stats[1].num}`,
  };
}

export default function Tool010ThreeThink() {
  const [tab, setTab] = useState<"f1" | "f2" | "f3">("f1");

  return (
    <ToolShell title="สามนึก" minEntries={4}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="space-y-4 animate-[fadeIn_0.5s]">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 text-center">
                    <div className="text-xs font-bold text-indigo-400">สูตร 1</div>
                    <div className="text-3xl font-black text-indigo-700">{result.f1.pred.d1}{result.f1.pred.d2}</div>
                  </div>
                  <div className="rounded-xl border-2 border-teal-200 bg-teal-50 p-4 text-center">
                    <div className="text-xs font-bold text-teal-400">สูตร 2</div>
                    <div className="text-3xl font-black text-teal-700">{result.f2.pred.d1}{result.f2.pred.d2}</div>
                  </div>
                  <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4 text-center">
                    <div className="text-xs font-bold text-rose-400">สูตร 3 (ดับ)</div>
                    <div className="text-3xl font-black text-rose-700">{result.f3.dead[0].num}, {result.f3.dead[1].num}</div>
                  </div>
                </div>

                <button onClick={() => { copyText(result.text); showToast("คัดลอกแล้ว"); }}
                  className="w-full rounded-xl bg-ink py-3 font-bold text-white shadow transition hover:bg-pine">
                  📋 คัดลอกผลลัพธ์ทั้งหมด
                </button>

                {/* Tabs */}
                <div className="flex rounded-xl bg-white p-1 shadow">
                  {(["f1", "f2", "f3"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${tab === t ? "bg-ink text-white" : "text-ink/60 hover:bg-gray-50"}`}>
                      {t === "f1" ? "สูตร 1" : t === "f2" ? "สูตร 2" : "สูตร 3 (Z-Score)"}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {tab === "f1" && (
                  <div className="overflow-hidden rounded-lg border border-ink/10">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b bg-gray-50 text-center font-bold">
                        <th className="p-2">งวด</th><th className="p-2">ผลออก</th><th className="p-2">ตัวตัด 1</th><th className="p-2">ตัวตัด 2</th><th className="p-2">ผล</th>
                      </tr></thead>
                      <tbody>{result.f1.history.slice(0, 15).map((h, i) => (
                        <tr key={i} className="border-b text-center hover:bg-gray-50">
                          <td className="p-2">{h.date}</td><td className="p-2 font-bold">{h.bot}</td>
                          <td className="p-2 font-bold text-indigo-600">{h.d1}</td><td className="p-2 font-bold text-indigo-600">{h.d2}</td>
                          <td className={`p-2 font-bold ${h.hit ? "text-red-600" : "text-green-600"}`}>{h.hit ? "❌ ติด" : "✅ ผ่าน"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                {tab === "f2" && (
                  <div className="overflow-hidden rounded-lg border border-ink/10">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b bg-gray-50 text-center font-bold">
                        <th className="p-2">งวด</th><th className="p-2">ผลออก</th><th className="p-2">ร้อย-1</th><th className="p-2">หน่วย-1</th><th className="p-2">ผล</th>
                      </tr></thead>
                      <tbody>{result.f2.history.slice(0, 15).map((h, i) => (
                        <tr key={i} className="border-b text-center hover:bg-gray-50">
                          <td className="p-2">{h.date}</td><td className="p-2 font-bold">{h.bot}</td>
                          <td className="p-2 font-bold text-teal-600">{h.d1}</td><td className="p-2 font-bold text-teal-600">{h.d2}</td>
                          <td className={`p-2 font-bold ${h.hit ? "text-red-600" : "text-green-600"}`}>{h.hit ? "❌ ติด" : "✅ ผ่าน"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                {tab === "f3" && (
                  <div className="overflow-hidden rounded-lg border border-ink/10">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b bg-gray-50 text-center font-bold">
                        <th className="p-2">เลข</th><th className="p-2">ออกทั้งหมด</th><th className="p-2">Gap</th><th className="p-2">Z-Score</th><th className="p-2">คะแนนดับ</th>
                      </tr></thead>
                      <tbody>{result.f3.stats.map((s) => (
                        <tr key={s.num} className="border-b text-center hover:bg-gray-50">
                          <td className="p-2 text-lg font-bold">{s.num}</td><td className="p-2">{s.count}</td>
                          <td className="p-2">{s.gap}</td><td className="p-2">{s.zScore.toFixed(2)}</td>
                          <td className="p-2 font-bold text-red-600">{s.finalScore.toFixed(1)}</td>
                        </tr>
                      ))}</tbody>
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
