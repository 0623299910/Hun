"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry } from "@/lib/data-parser";

function analyze(data: ParsedEntry[]) {
  const bottomNumbers = data.map((e) => e.bottom);
  if (bottomNumbers.length < 2) return null;

  const stats = Array.from({ length: 10 }, (_, i) => ({
    num: i, count: 0, gap: -1, zScore: 0, finalScore: 0,
  }));

  bottomNumbers.forEach((numStr, index) => {
    for (const ch of numStr) {
      const dd = parseInt(ch);
      stats[dd].count++;
      if (stats[dd].gap === -1) stats[dd].gap = index;
    }
  });

  stats.forEach((s) => { if (s.gap === -1) s.gap = bottomNumbers.length; });

  const counts = stats.map((s) => s.count);
  const mean = counts.reduce((a, b) => a + b, 0) / 10;
  const variance = counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 10;
  const stdDev = Math.sqrt(variance);

  stats.forEach((s) => {
    s.zScore = stdDev === 0 ? 0 : parseFloat(((s.count - mean) / stdDev).toFixed(2));
    const recencyBonus = bottomNumbers[0].includes(s.num.toString()) ? 20 : 0;
    s.finalScore = parseFloat((s.zScore * 15 + s.gap * 5 + recencyBonus).toFixed(1));
  });

  stats.sort((a, b) => b.finalScore - a.finalScore);
  return { stats, totalDraws: bottomNumbers.length };
}

export default function Tool002LowProbability() {
  return (
    <ToolShell title="โอกาสมาน้อยที่สุด" minEntries={2}>
      {({ data, localInput, setLocalInput }) => {
        const result = analyze(data);
        return (
          <div className="space-y-4">
            {result && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center animate-[fadeIn_0.5s_ease-out]">
                <span className="text-sm text-ink/60">
                  เลขเด่น (0-9) ที่มีโอกาสมาน้อยที่สุดใน 2 ตัวล่าง
                </span>
                <div className="my-2 text-5xl font-extrabold tracking-wider text-red-600">
                  {result.stats[0].num} และ {result.stats[1].num}
                </div>
                <small className="text-ink/50">
                  *วิเคราะห์จากฐานข้อมูล {result.totalDraws} งวดล่าสุด
                </small>
              </div>
            )}

            <DataInput value={localInput} onChange={setLocalInput} />

            {result && (
              <div className="animate-[fadeIn_0.5s_ease-out] space-y-4">

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
                  <h3 className="bg-gray-50 px-4 py-3 text-lg font-bold">
                    ตารางวิเคราะห์สถิติเชิงลึก
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-center text-xs font-bold uppercase text-ink/60">
                        <th className="p-3">เลข</th>
                        <th className="p-3">ออกทั้งหมด</th>
                        <th className="p-3">หายไป (Gap)</th>
                        <th className="p-3">Z-Score</th>
                        <th className="p-3">คะแนนความดับ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.stats.map((s) => (
                        <tr
                          key={s.num}
                          className="border-b text-center transition hover:bg-gray-50"
                        >
                          <td className="p-3 text-lg font-bold">{s.num}</td>
                          <td className="p-3">{s.count}</td>
                          <td className="p-3">{s.gap} งวด</td>
                          <td
                            className="p-3"
                            style={{
                              color: s.zScore > 1.5 ? "#e11d48" : s.zScore < -1.5 ? "#3b82f6" : undefined,
                              fontWeight: Math.abs(s.zScore) > 1.5 ? "bold" : undefined,
                            }}
                          >
                            {s.zScore}
                          </td>
                          <td className="p-3 font-bold text-red-600">{s.finalScore}</td>
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
