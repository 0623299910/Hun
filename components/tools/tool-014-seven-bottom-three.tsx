"use client";
import { useState, useMemo, useCallback } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, copyText } from "@/lib/data-parser";

/* ---------- helpers ---------- */
interface FreqItem { digit: number; count: number }

function getCounts(data: ParsedEntry[], limit?: number): FreqItem[] {
  const slice = limit ? data.slice(-limit) : data;
  const freq = Array(10).fill(0);
  slice.forEach((e) => { freq[parseInt(e.bottom[0])]++; freq[parseInt(e.bottom[1])]++; });
  return freq.map((c, i) => ({ digit: i, count: c })).sort((a, b) => b.count - a.count);
}

function checkWin(bot: string, predicted: number[]): boolean {
  return predicted.includes(parseInt(bot[0])) || predicted.includes(parseInt(bot[1]));
}

type FormulaFn = (data: ParsedEntry[]) => number[];

/* ---------- 7 formulas ---------- */
const formulas: { id: number; name: string; fn: FormulaFn }[] = [
  {
    id: 1, name: "กระแสปัจจุบัน",
    fn: (d) => getCounts(d, 10).slice(0, 7).map((x) => x.digit),
  },
  {
    id: 2, name: "เจ้าสถิติ",
    fn: (d) => getCounts(d).slice(0, 7).map((x) => x.digit),
  },
  {
    id: 3, name: "เซียนหลักสิบ",
    fn: (d) => {
      const freq = Array(10).fill(0);
      d.slice(-20).forEach((e) => freq[parseInt(e.bottom[0])]++);
      return freq.map((c, i) => ({ digit: i, count: c })).sort((a, b) => b.count - a.count).slice(0, 7).map((x) => x.digit);
    },
  },
  {
    id: 4, name: "เซียนหลักหน่วย",
    fn: (d) => {
      const freq = Array(10).fill(0);
      d.slice(-20).forEach((e) => freq[parseInt(e.bottom[1])]++);
      return freq.map((c, i) => ({ digit: i, count: c })).sort((a, b) => b.count - a.count).slice(0, 7).map((x) => x.digit);
    },
  },
  {
    id: 5, name: "ตามวัน",
    fn: (d) => {
      const last = d[d.length - 1];
      const dayIdx = new Date(last.date).getDay();
      const filtered = d.filter((e) => new Date(e.date).getDay() === dayIdx);
      return getCounts(filtered.length > 0 ? filtered : d).slice(0, 7).map((x) => x.digit);
    },
  },
  {
    id: 6, name: "เลขตาม",
    fn: (d) => {
      if (d.length < 2) return getCounts(d).slice(0, 7).map((x) => x.digit);
      const prev = d[d.length - 2];
      const pDigits = [parseInt(prev.bottom[0]), parseInt(prev.bottom[1])];
      const freq = Array(10).fill(0);
      for (let i = 0; i < d.length - 1; i++) {
        const t = parseInt(d[i].bottom[0]), u = parseInt(d[i].bottom[1]);
        if (pDigits.includes(t) || pDigits.includes(u)) {
          const nt = parseInt(d[i + 1].bottom[0]), nu = parseInt(d[i + 1].bottom[1]);
          freq[nt]++; freq[nu]++;
        }
      }
      return freq.map((c, i) => ({ digit: i, count: c })).sort((a, b) => b.count - a.count).slice(0, 7).map((x) => x.digit);
    },
  },
  {
    id: 7, name: "จังหวะรอบ",
    fn: (d) => {
      const slice = d.slice(-15, -2);
      return getCounts(slice.length > 0 ? slice : d).slice(0, 7).map((x) => x.digit);
    },
  },
];

function calcAccuracy(data: ParsedEntry[], fn: FormulaFn, checks = 10) {
  const history: { date: string; bot: string; predicted: number[]; hit: boolean }[] = [];
  const maxI = Math.min(checks, data.length - 3);
  for (let i = 0; i < maxI; i++) {
    const targetIdx = data.length - 1 - i;
    const train = data.slice(0, targetIdx);
    if (train.length < 3) continue;
    const predicted = fn(train);
    const actual = data[targetIdx];
    const hit = checkWin(actual.bottom, predicted);
    history.push({ date: actual.date, bot: actual.bottom, predicted, hit });
  }
  return { hits: history.filter((h) => h.hit).length, total: history.length, history };
}

/* ---------- component ---------- */
export default function Tool014SevenBottomThree() {
  const [selectedFormula, setSelectedFormula] = useState<number | null>(null);

  return (
    <ToolShell title="เจ็ดตัวล่างสูตรสาม" minEntries={5}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const results = useMemo(() => {
          if (data.length < 5) return [];
          return formulas.map((f) => {
            const digits = f.fn(data);
            const missing = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !digits.includes(d));
            const acc = calcAccuracy(data, f.fn);
            return { ...f, digits, missing, acc };
          });
        }, [data]);

        const perfectResults = results.filter((r) => r.acc.total > 0 && r.acc.hits === r.acc.total);

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {results.length > 0 && (
              <div className="space-y-4 animate-[fadeIn_0.3s]">
                {/* Perfect formulas highlight */}
                {perfectResults.length > 0 && (
                  <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
                    <h3 className="mb-2 font-bold text-green-800">✨ สูตรแม่น 100% (ดับ = เลขที่ไม่อยู่ใน 7 ตัว)</h3>
                    <div className="flex flex-wrap gap-2">
                      {perfectResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            const txt = r.missing.join("");
                            copyText(txt).then(() => showToast(`คัดลอก ${txt}`));
                          }}
                          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white shadow hover:bg-green-700 transition"
                        >
                          {r.name}: ตัดเลข {r.missing.join(" ")}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const txt = perfectResults.map((r) => `${r.name}: ${r.missing.join(" ")}`).join("   ");
                        copyText(txt).then(() => showToast("คัดลอกสูตรแม่น 100% ทั้งหมด"));
                      }}
                      className="mt-2 w-full rounded-lg bg-green-700 px-3 py-2 text-sm font-bold text-white shadow hover:bg-green-800 transition"
                    >
                      📋 คัดลอกทั้งหมด (แนวนอน)
                    </button>
                  </div>
                )}

                {/* All formulas */}
                <div className="space-y-3">
                  {results.map((r) => (
                    <div key={r.id} className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-ink">
                          สูตร {r.id}: {r.name}
                        </h4>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          r.acc.total > 0 && r.acc.hits === r.acc.total
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {r.acc.hits}/{r.acc.total}
                        </span>
                      </div>

                      {/* 7 safe digits */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.digits.sort((a, b) => a - b).map((dg) => (
                          <span key={dg} className="flex h-9 w-9 items-center justify-center rounded-full bg-pine text-white text-lg font-bold shadow">
                            {dg}
                          </span>
                        ))}
                      </div>

                      {/* Dead 3 digits */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-red-600 font-bold">ดับ:</span>
                        {r.missing.map((dg) => (
                          <span key={dg} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700 text-sm font-bold border border-red-200">
                            {dg}
                          </span>
                        ))}
                        <button
                          onClick={() => { copyText(r.missing.join("")).then(() => showToast(`คัดลอกดับ: ${r.missing.join("")}`)); }}
                          className="ml-auto text-xs text-blue-600 hover:underline"
                        >
                          📋 คัดลอก
                        </button>
                      </div>

                      {/* Expandable history */}
                      <button onClick={() => setSelectedFormula(selectedFormula === r.id ? null : r.id)} className="mt-2 text-xs text-ink/50 hover:text-ink">
                        {selectedFormula === r.id ? "▲ ซ่อนประวัติ" : "▼ ดูประวัติ"}
                      </button>
                      {selectedFormula === r.id && (
                        <div className="mt-2 max-h-48 overflow-auto rounded-lg border text-xs">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-gray-50"><tr className="text-center font-bold border-b">
                              <th className="p-1.5">งวด</th><th className="p-1.5">ผลออก</th><th className="p-1.5">ทำนาย 7 ตัว</th><th className="p-1.5">สถานะ</th>
                            </tr></thead>
                            <tbody>{r.acc.history.map((h, i) => (
                              <tr key={i} className="text-center border-b hover:bg-gray-50">
                                <td className="p-1.5">{h.date}</td>
                                <td className="p-1.5 font-bold">{h.bot}</td>
                                <td className="p-1.5">{h.predicted.sort((a, b) => a - b).join(" ")}</td>
                                <td className={`p-1.5 font-bold ${h.hit ? "text-green-600" : "text-red-600"}`}>{h.hit ? "✅" : "❌"}</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
