"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, copyText } from "@/lib/data-parser";

/* ═══════════════════════════════════════════════════════════════
   3. ดับจากหลัก 10-หน่วย งวดก่อน (3 สูตร)
   ═══════════════════════════════════════════════════════════════ */

interface HistoryRow {
  date: string;
  prevData: string;
  deadPair: string;
  actualBottom: string;
  result: "ผ่าน" | "ไม่ผ่าน";
}

interface FormulaResult {
  title: string;
  description: string;
  currentPrediction: string;
  history: HistoryRow[];
  passCount: number;
  totalCount: number;
  passRate: number;
  color: string;
}

interface ComputeResult {
  formulas: FormulaResult[];
}

/* ─── Formula 1: หลักสิบล่าง × หลักหน่วยล่าง งวดก่อน ─── */
function computeFormula1(data: ParsedEntry[]): FormulaResult | null {
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

  for (let i = 1; i < n; i++) {
    const prevBottom = data[i - 1].bottom;
    const prevTens = d(prevBottom, 0);
    const prevOnes = d(prevBottom, 1);
    const deadPair = `${prevTens}${prevOnes}`;
    
    const actualBottom = data[i].bottom;
    const isPass = actualBottom !== deadPair;
    
    history.unshift({
      date: data[i].date,
      prevData: `2ล่าง: ${prevBottom}`,
      deadPair: deadPair,
      actualBottom: actualBottom,
      result: isPass ? "ผ่าน" : "ไม่ผ่าน",
    });

    totalCount++;
    if (isPass) passCount++;
  }

  const passRate = totalCount > 0 ? (passCount / totalCount) * 100 : 0;

  return {
    title: "สูตรที่ 1: หลัก 10-หน่วย ล่าง",
    description: "หลักสิบและหลักหน่วยของ 2 ตัวล่าง งวดก่อน → คู่ดับ",
    currentPrediction,
    history,
    passCount,
    totalCount,
    passRate,
    color: "red",
  };
}

/* ─── Formula 2: หลักสิบบน × หลักหน่วยบน งวดก่อน ─── */
function computeFormula2(data: ParsedEntry[]): FormulaResult | null {
  if (data.length < 2) return null;
  const n = data.length;

  // Current prediction: use the latest draw's top 3 digits (middle two)
  const latestTop = data[n - 1].top;
  const tens = d(latestTop, 1); // middle digit (tens place of top 3)
  const ones = d(latestTop, 2); // last digit (ones place of top 3)
  const currentPrediction = `${tens}${ones}`;

  // Build history
  const history: HistoryRow[] = [];
  let passCount = 0;
  let totalCount = 0;

  for (let i = 1; i < n; i++) {
    const prevTop = data[i - 1].top;
    const prevTens = d(prevTop, 1);
    const prevOnes = d(prevTop, 2);
    const deadPair = `${prevTens}${prevOnes}`;
    
    const actualBottom = data[i].bottom;
    const isPass = actualBottom !== deadPair;
    
    history.unshift({
      date: data[i].date,
      prevData: `3บน: ${prevTop}`,
      deadPair: deadPair,
      actualBottom: actualBottom,
      result: isPass ? "ผ่าน" : "ไม่ผ่าน",
    });

    totalCount++;
    if (isPass) passCount++;
  }

  const passRate = totalCount > 0 ? (passCount / totalCount) * 100 : 0;

  return {
    title: "สูตรที่ 2: หลัก 10-หน่วย บน",
    description: "หลักสิบและหลักหน่วยของ 3 ตัวบน งวดก่อน → คู่ดับ",
    currentPrediction,
    history,
    passCount,
    totalCount,
    passRate,
    color: "blue",
  };
}

/* ─── Formula 3: หลักสิบบน × หลักหน่วยล่าง งวดก่อน ─── */
function computeFormula3(data: ParsedEntry[]): FormulaResult | null {
  if (data.length < 2) return null;
  const n = data.length;

  // Current prediction: tens from top, ones from bottom
  const latestTop = data[n - 1].top;
  const latestBottom = data[n - 1].bottom;
  const tens = d(latestTop, 1); // middle digit of top 3
  const ones = d(latestBottom, 1); // last digit of bottom 2
  const currentPrediction = `${tens}${ones}`;

  // Build history
  const history: HistoryRow[] = [];
  let passCount = 0;
  let totalCount = 0;

  for (let i = 1; i < n; i++) {
    const prevTop = data[i - 1].top;
    const prevBottom = data[i - 1].bottom;
    const prevTens = d(prevTop, 1);
    const prevOnes = d(prevBottom, 1);
    const deadPair = `${prevTens}${prevOnes}`;
    
    const actualBottom = data[i].bottom;
    const isPass = actualBottom !== deadPair;
    
    history.unshift({
      date: data[i].date,
      prevData: `3บน: ${prevTop}, 2ล่าง: ${prevBottom}`,
      deadPair: deadPair,
      actualBottom: actualBottom,
      result: isPass ? "ผ่าน" : "ไม่ผ่าน",
    });

    totalCount++;
    if (isPass) passCount++;
  }

  const passRate = totalCount > 0 ? (passCount / totalCount) * 100 : 0;

  return {
    title: "สูตรที่ 3: หลัก 10 บน × หน่วยล่าง",
    description: "หลักสิบของ 3 ตัวบน × หลักหน่วยของ 2 ตัวล่าง งวดก่อน → คู่ดับ",
    currentPrediction,
    history,
    passCount,
    totalCount,
    passRate,
    color: "purple",
  };
}

/* ─── Main compute ─── */
function compute(data: ParsedEntry[]): ComputeResult | null {
  if (data.length < 2) return null;

  const f1 = computeFormula1(data);
  const f2 = computeFormula2(data);
  const f3 = computeFormula3(data);

  if (!f1 || !f2 || !f3) return null;

  return {
    formulas: [f1, f2, f3],
  };
}

/* ─── Formula Card Component ─── */
function FormulaCard({
  formula,
  showToast,
}: {
  formula: FormulaResult;
  showToast: (msg: string) => void;
}) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "red":
        return {
          border: "border-red-300",
          bg: "from-red-50 to-red-100",
          text: "text-red-700",
          button: "bg-red-600 hover:bg-red-700",
          badge: "text-red-600",
          headerBg: "from-red-700 to-red-600",
          tableBg: "bg-red-200",
        };
      case "blue":
        return {
          border: "border-blue-300",
          bg: "from-blue-50 to-blue-100",
          text: "text-blue-700",
          button: "bg-blue-600 hover:bg-blue-700",
          badge: "text-blue-600",
          headerBg: "from-blue-700 to-blue-600",
          tableBg: "bg-blue-200",
        };
      case "purple":
        return {
          border: "border-purple-300",
          bg: "from-purple-50 to-purple-100",
          text: "text-purple-700",
          button: "bg-purple-600 hover:bg-purple-700",
          badge: "text-purple-600",
          headerBg: "from-purple-700 to-purple-600",
          tableBg: "bg-purple-200",
        };
      default:
        return {
          border: "border-gray-300",
          bg: "from-gray-50 to-gray-100",
          text: "text-gray-700",
          button: "bg-gray-600 hover:bg-gray-700",
          badge: "text-gray-600",
          headerBg: "from-gray-700 to-gray-600",
          tableBg: "bg-gray-200",
        };
    }
  };

  const colorClasses = getColorClasses(formula.color);

  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-white p-6 shadow-lg">
      {/* Title */}
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-ink">{formula.title}</h3>
        <p className="mt-1 text-xs text-ink/60">{formula.description}</p>
      </div>

      {/* Current Prediction */}
      <div className={`rounded-xl border-2 ${colorClasses.border} bg-gradient-to-br ${colorClasses.bg} p-6 text-center shadow-lg mb-4`}>
        <div className={`mb-2 text-sm font-semibold uppercase tracking-wide ${colorClasses.text}`}>
          🎯 คู่ดับ 2 ตัวล่าง (งวดถัดไป)
        </div>
        <div className={`my-3 text-6xl font-extrabold tracking-widest ${colorClasses.badge}`}>
          {formula.currentPrediction}
        </div>
        <button
          onClick={() => {
            copyText(formula.currentPrediction);
            showToast(`คัดลอก ${formula.currentPrediction} แล้ว`);
          }}
          className={`mt-4 rounded-lg ${colorClasses.button} px-6 py-2 text-sm font-bold text-white shadow transition`}
        >
          📋 คัดลอก
        </button>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-3 gap-4 rounded-xl border border-ink/10 bg-gray-50 p-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-ink/60">ผ่าน</div>
          <div className="text-2xl font-bold text-emerald-600">{formula.passCount}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-ink/60">ไม่ผ่าน</div>
          <div className="text-2xl font-bold text-red-600">
            {formula.totalCount - formula.passCount}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-ink/60">อัตราผ่าน</div>
          <div className={`text-2xl font-bold ${colorClasses.badge}`}>
            {formula.passRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow">
        <div className={`bg-gradient-to-r ${colorClasses.headerBg} px-4 py-3`}>
          <h4 className="text-sm font-bold text-white">
            📊 สถิติย้อนหลังทุกงวด ({formula.history.length} งวด)
          </h4>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 shadow-sm">
              <tr className="text-center text-xs font-bold uppercase text-ink/70">
                <th className="border-b border-ink/10 p-2">วันที่</th>
                <th className="border-b border-ink/10 p-2">ข้อมูลงวดก่อน</th>
                <th className="border-b border-ink/10 p-2">คู่ดับ</th>
                <th className="border-b border-ink/10 p-2">2ล่างจริง</th>
                <th className="border-b border-ink/10 p-2">ผล</th>
              </tr>
            </thead>
            <tbody>
              {formula.history.map((row, idx) => {
                const isPass = row.result === "ผ่าน";
                return (
                  <tr
                    key={idx}
                    className={`border-b text-center transition ${
                      isPass ? "bg-emerald-50 hover:bg-emerald-100" : "bg-red-50 hover:bg-red-100"
                    }`}
                  >
                    <td className="p-2 text-xs text-ink/60">{row.date}</td>
                    <td className="p-2 text-xs">
                      {row.prevData}
                    </td>
                    <td className="p-2">
                      <span className={`rounded ${colorClasses.tableBg} px-2 py-1 font-mono text-sm font-bold ${colorClasses.text}`}>
                        {row.deadPair}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className="rounded bg-slate-200 px-2 py-1 font-mono text-sm font-bold text-slate-700">
                        {row.actualBottom}
                      </span>
                    </td>
                    <td className="p-2">
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

/* ─── inner component ─── */
function Results({
  result,
  showToast,
}: {
  result: ComputeResult;
  showToast: (msg: string) => void;
}) {
  return (
    <div className="animate-[fadeIn_0.5s] space-y-6">
      {/* Summary Banner */}
      <div className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 text-center shadow-lg">
        <h2 className="text-2xl font-extrabold text-indigo-700 mb-2">
          🎲 3 สูตรคู่ดับจากหลัก 10-หน่วย
        </h2>
        <p className="text-sm text-ink/70">
          เปรียบเทียบ 3 สูตรในการคำนวณคู่ดับจากงวดก่อนหน้า
        </p>
      </div>

      {/* All Three Formulas */}
      {result.formulas.map((formula, idx) => (
        <FormulaCard key={idx} formula={formula} showToast={showToast} />
      ))}
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
