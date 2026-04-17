"use client";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, copyText } from "@/lib/data-parser";

function analyzePatterns(data: ParsedEntry[], targetDigit: string) {
  const cases = data.filter((item) => item.top.charAt(0) === targetDigit);
  const counts: Record<number, number> = {};
  for (let i = 0; i <= 9; i++) counts[i] = 0;
  cases.forEach((item) => {
    for (const ch of item.bottom) counts[parseInt(ch)]++;
  });
  const sorted = Object.entries(counts)
    .map(([digit, count]) => ({
      digit: parseInt(digit),
      count,
      probability: cases.length > 0 ? ((count / (cases.length * 2)) * 100).toFixed(1) : "0.0",
    }))
    .sort((a, b) => b.count - a.count);
  return {
    topDigits: sorted.slice(0, 8),
    leastLikely: sorted.slice(-2).reverse(),
    totalCases: cases.length,
    dateRange:
      cases.length > 0
        ? `${cases[cases.length - 1].date.slice(5)} - ${cases[0].date.slice(5)}`
        : "-",
  };
}

export default function Tool001HundredsCut() {
  return (
    <ToolShell title="ดับจากหลักร้อย" minEntries={1}>
      {(props) => <Tool001Inner {...props} />}
    </ToolShell>
  );
}

function Tool001Inner({
  data,
  localInput,
  setLocalInput,
  toast,
  showToast,
}: {
  data: ParsedEntry[];
  localInput: string;
  setLocalInput: (v: string) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}) {
  const [selectedDigit, setSelectedDigit] = useState<string>(() =>
    data.length > 0 ? data[data.length - 1].top.charAt(0) : "0"
  );
  const [userSelected, setUserSelected] = useState(false);
  const leastLikelyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userSelected && data.length > 0) {
      setSelectedDigit(data[data.length - 1].top.charAt(0));
    }
  }, [data, userSelected]);

  useEffect(() => {
    if (data.length > 0 && leastLikelyRef.current) {
      setTimeout(() => {
        leastLikelyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [data]);

  const analysis = analyzePatterns(data, selectedDigit);
  return (
          <div className="space-y-4">
            {/* Digit selector */}
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <h2 className="mb-3 text-center text-lg font-bold text-ink">
                🎯 เลือกเลขหลักร้อยที่ต้องการวิเคราะห์
              </h2>
              <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedDigit(String(i)); setUserSelected(true); }}
                    className={`rounded-lg py-3 text-center font-bold transition-all ${
                      selectedDigit === String(i)
                        ? "scale-105 bg-purple-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <h2 className="mb-2 text-center text-xl font-bold text-ink">
                ผลการวิเคราะห์ TOP 8
              </h2>
              <p className="mb-4 text-center text-sm text-ink/60">
                กำลังวิเคราะห์เลข{" "}
                <span className="text-lg font-bold text-purple-600">{selectedDigit}</span>{" "}
                หลักร้อย
              </p>
              {analysis.totalCases === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center text-gray-500">
                  ไม่พบข้อมูลสำหรับเลข {selectedDigit} หลักร้อย
                  <br />
                  <span className="text-xs">กรุณาเพิ่มข้อมูลเพื่อเริ่มการวิเคราะห์</span>
                </div>
              ) : (
                <>
                  <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {analysis.topDigits.map((item, idx) => {
                      const colors = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];
                      const color = colors[Math.min(idx, colors.length - 1)];
                      return (
                        <div
                          key={item.digit}
                          className="rounded-xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-md transition hover:-translate-y-1"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white"
                                style={{ backgroundColor: color }}
                              >
                                {item.digit}
                              </div>
                              <div>
                                <div className="text-xs text-ink/60">อันดับ {idx + 1}</div>
                                <div className="text-xl font-bold text-purple-600">
                                  {item.count} ครั้ง
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-ink/60">โอกาส</div>
                              <div className="text-lg font-bold text-purple-600">
                                {item.probability}%
                              </div>
                            </div>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.probability}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Least likely */}
                  <div ref={leastLikelyRef} className="border-t-2 border-gray-200 pt-4">
                    <h3 className="mb-3 text-center text-lg font-bold text-red-600">
                      ⚠️ เลขที่มีโอกาสน้อยที่สุด 2 อันดับ
                    </h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {analysis.leastLikely.map((item, idx) => (
                        <div
                          key={item.digit}
                          className="rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-white p-4 shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-xl font-bold text-white">
                                {item.digit}
                              </div>
                              <div>
                                <div className="text-xs text-ink/60">
                                  อันดับที่น้อย {idx + 1}
                                </div>
                                <div className="text-xl font-bold text-red-600">
                                  {item.count} ครั้ง
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-ink/60">โอกาส</div>
                              <div className="text-lg font-bold text-red-600">
                                {item.probability}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl bg-white/80 p-3 text-center shadow">
                <div className="text-2xl font-bold">{analysis.totalCases}</div>
                <div className="text-xs text-ink/60">งวดที่มีเลขนี้หลักร้อย</div>
              </div>
              <div className="rounded-xl bg-white/80 p-3 text-center shadow">
                <div className="text-2xl font-bold">{analysis.dateRange}</div>
                <div className="text-xs text-ink/60">ช่วงวันที่วิเคราะห์</div>
              </div>
              <div className="rounded-xl bg-white/80 p-3 text-center shadow">
                <div className="text-2xl font-bold">
                  {analysis.topDigits[0]?.digit ?? "-"}
                </div>
                <div className="text-xs text-ink/60">เลขที่พบมากที่สุด</div>
              </div>
              <div className="rounded-xl bg-white/80 p-3 text-center shadow">
                <div className="text-2xl font-bold">
                  {analysis.topDigits[0]?.probability ?? "0"}%
                </div>
                <div className="text-xs text-ink/60">โอกาสสูงสุด</div>
              </div>
            </div>

            {/* Input */}
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <DataInput value={localInput} onChange={setLocalInput} />
            </div>
          </div>
    );
}
