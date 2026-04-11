"use client";
import { useState, useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry } from "@/lib/data-parser";

/* CSS bar chart replacement for Chart.js */
function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: 200 }}>
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
          <span className="mb-1 text-[10px] font-bold text-gray-600">{v}</span>
          <div
            className={`w-full rounded-t transition-all ${v === 0 ? "bg-red-200" : "bg-blue-500"}`}
            style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 4 : 2 }}
          />
          <span className="mt-1 text-[10px] text-gray-500">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function ToolLatestPointCut() {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  return (
    <ToolShell title="ดับจากแต้มล่าสุด" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        /* compute points from bottom 2 digits */
        const points = useMemo(() => {
          return data.map((e) => (parseInt(e.bottom[0]) + parseInt(e.bottom[1])) % 10);
        }, [data]);

        /* transition stats: for each pair (curr → next), record what came next after each point */
        const rawStats = useMemo(() => {
          const stats: { curr: number; next: number }[] = [];
          for (let i = 0; i < points.length - 1; i++) {
            stats.push({ curr: points[i], next: points[i + 1] });
          }
          return stats;
        }, [points]);

        /* frequency for selected point */
        const freq = useMemo(() => {
          if (selectedPoint === null) return Array(10).fill(0);
          const f = Array(10).fill(0);
          rawStats.forEach((s) => { if (s.curr === selectedPoint) f[s.next]++; });
          return f;
        }, [rawStats, selectedPoint]);

        /* dormant points = frequency 0 */
        const dormant = freq.map((f, i) => ({ digit: i, f })).filter((x) => x.f === 0 && selectedPoint !== null);

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {points.length >= 2 && (
              <div className="space-y-4 animate-[fadeIn_0.3s]">
                <div className="text-center text-sm font-bold text-green-600">
                  ✅ วิเคราะห์ข้อมูล {points.length} งวดสำเร็จ
                </div>

                {/* Point selector */}
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="mb-3 text-center font-bold text-ink/70">แต้มงวดล่าสุดคืออะไร?</div>
                  <div className="grid grid-cols-5 gap-2.5">
                    {Array.from({ length: 10 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPoint(i)}
                        className={`rounded-lg border-2 p-3 font-bold transition ${
                          selectedPoint === i ? "border-blue-500 bg-blue-500 text-white" : "border-blue-300 text-blue-500 hover:bg-blue-50"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPoint !== null && (
                  <div className="space-y-4 animate-[fadeIn_0.3s]">
                    {/* Bar chart */}
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                      <h3 className="mb-3 text-sm font-bold text-ink/70">📊 จำนวนครั้งที่ออกงวดถัดไป (หลังแต้ม {selectedPoint})</h3>
                      <BarChart
                        data={freq}
                        labels={Array.from({ length: 10 }, (_, i) => `แต้ม ${i}`)}
                      />
                    </div>

                    {/* Dormant points */}
                    <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5 text-center">
                      <h3 className="mb-3 font-bold text-red-700">🚫 แต้มที่มีโอกาสมาน้อยที่สุด (แต้มดับ)</h3>
                      {dormant.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-2">
                          {dormant.map((d) => (
                            <span key={d.digit} className="rounded-full bg-red-600 px-4 py-1.5 text-lg font-bold text-white">
                              {d.digit}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">ไม่มีแต้มดับ (ออกครบทุกแต้ม)</span>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        (วิเคราะห์จากแต้มที่ไม่เคยออกเลยตามหลังแต้ม {selectedPoint})
                      </p>
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
