"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, copyText } from "@/lib/data-parser";

/* ═══════════════════════════════════════════════════════════════
   3. ดับจากหลัก 10-หน่วย งวดก่อน
   ═══════════════════════════════════════════════════════════════ */

interface HistoryRow {
  date: string;
  prevBottom: string;
  deadPair: string;
  actualBottom: string;
  result: "ผ่าน" | "ไม่ผ่าน";
}

interface ComputeResult {
  currentPrediction: string;
  history: HistoryRow[];
  passCount: number;
  totalCount: number;
  passRate: number;
}

/* ─── core compute ─── */
function compute(data: ParsedEntry[]): ComputeResult | null {
  if (data.length < 2) return null;
  const n = data.length;

  // Current prediction: use the latest draw's bottom
  const latestBottom = data[n - 1].bottom;
  const tens = d(latestBottom, 0);
  const ones = d(latestBottom, 1);
  const currentPrediction = `${tens}${ones}`;

  // Build history
  const history: HistoryRow[] = [];
  let passCount = 0;
  let totalCount = 0;

  // Start from index 1 (we need previous draw)
  for (let i = 1; i < n; i++) {
    const prevBottom = data[i - 1].bottom;
    const prevTens = d(prevBottom, 0);
    const prevOnes = d(prevBottom, 1);
    const deadPair = `${prevTens}${prevOnes}`;
    
    const actualBottom = data[i].bottom;
    
    // Check if dead pair matches actual bottom
    const isPass = actualBottom !== deadPair;
    
    history.unshift({
      date: data[i].date,
      prevBottom: prevBottom,
      deadPair: deadPair,
      actualBottom: actualBottom,
      result: isPass ? "ผ่าน" : "ไม่ผ่าน",
    });

    totalCount++;
    if (isPass) passCount++;
  }

  const passRate = totalCount > 0 ? (passCount / totalCount) * 100 : 0;

  return {
    currentPrediction,
    history,
    passCount,
    totalCount,
    passRate,
  };
}

/* ─── inner component ─── */
function Results({
  result,
  showToast,
}: {
  result: ComputeResult;
  showToast: (msg: string) => void;
}) {
  return (
    <div className="animate-[fadeIn_0.5s] space-y-5">
      {/* ─── Current Prediction ─── */}
      <div className="rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-red-100 p-6 text-center shadow-lg">
        <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-700">
          🎯 คู่ดับ 2 ตัวล่าง (งวดถัดไป)
        </div>
        <div className="my-3 text-6xl font-extrabold tracking-widest text-red-600">
          {result.currentPrediction}
        </div>
        <div className="mt-3 text-xs text-ink/60">
          จากหลักสิบและหลักหน่วยของงวดล่าสุด
        </div>
        <button
          onClick={() => {
            copyText(result.currentPrediction);
            showToast(`คัดลอก ${result.currentPrediction} แล้ว`);
          }}
          className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white shadow transition hover:bg-red-700"
        >
          📋 คัดลอก
        </button>
      </div>

      {/* ─── Statistics Summary ─── */}
      <div className="grid grid-cols-3 gap-4 rounded-xl border border-ink/10 bg-white p-4">
        <div className="text-center">
          <div className="text-sm text-ink/60">ผ่าน</div>
          <div className="text-2xl font-bold text-emerald-600">{result.passCount}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-ink/60">ไม่ผ่าน</div>
          <div className="text-2xl font-bold text-red-600">
            {result.totalCount - result.passCount}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-ink/60">อัตราผ่าน</div>
          <div className="text-2xl font-bold text-blue-600">
            {result.passRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* ─── History Table ─── */}
      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow">
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-3">
          <h3 className="text-lg font-bold text-white">
            📊 สถิติย้อนหลังทุกงวด ({result.history.length} งวด)
          </h3>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 shadow-sm">
              <tr className="text-center text-xs font-bold uppercase text-ink/70">
                <th className="border-b border-ink/10 p-3">วันที่</th>
                <th className="border-b border-ink/10 p-3">2ล่างงวดก่อน</th>
                <th className="border-b border-ink/10 p-3">คู่ดับ</th>
                <th className="border-b border-ink/10 p-3">2ล่างจริง</th>
                <th className="border-b border-ink/10 p-3">ผล</th>
              </tr>
            </thead>
            <tbody>
              {result.history.map((row, idx) => {
                const isPass = row.result === "ผ่าน";
                return (
                  <tr
                    key={idx}
                    className={`border-b text-center transition ${
                      isPass ? "bg-emerald-50 hover:bg-emerald-100" : "bg-red-50 hover:bg-red-100"
                    }`}
                  >
                    <td className="p-3 text-xs text-ink/60">{row.date}</td>
                    <td className="p-3">
                      <span className="rounded bg-slate-200 px-2 py-1 font-mono text-sm font-bold">
                        {row.prevBottom}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-red-200 px-2 py-1 font-mono text-sm font-bold text-red-700">
                        {row.deadPair}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-blue-200 px-2 py-1 font-mono text-sm font-bold text-blue-700">
                        {row.actualBottom}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                          isPass
                            ? "bg-emerald-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {row.result}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── main component ─── */
export default function Tool003TensOnesDead() {
  return (
    <ToolShell title="3. ดับจากหลัก 10-หน่วย งวดก่อน" minEntries={2}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = useMemo(() => compute(data), [data]);
        return (
          <div className="space-y-4">
            {result && <Results result={result} showToast={showToast} />}
            <DataInput value={localInput} onChange={setLocalInput} />
          </div>
        );
      }}
    </ToolShell>
  );
}
