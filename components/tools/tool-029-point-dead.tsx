"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  29. ดับแต้มล่าง — ปักหลักสิบ 5 สูตร × ปักหลักหน่วย 5 สูตร
  จับคู่: สิบสูตร i ↔ หน่วยสูตร i → ได้คู่ดับล่าง 2 ตัวตรง 5 คู่
  ผ่าน = เลขล่าง 2 ตัวตรงไม่ตรงกับคู่ดับ
*/

/* ═══════ ปักหลักสิบ 5 สูตร ═══════ */

function tens1(data: ParsedEntry[], idx: number): number {
  const tens = data.slice(0, idx + 1).map((e) => d(e.bottom, 0));
  const n = tens.length;
  const freq = Array(10).fill(0);
  const lastSeen = Array(10).fill(-1);
  for (let i = 0; i < n; i++) { freq[tens[i]]++; lastSeen[tens[i]] = i; }
  const gap = lastSeen.map((ls) => (ls === -1 ? n : n - 1 - ls));
  const scored = Array.from({ length: 10 }, (_, i) => ({
    digit: i, score: gap[i] * 2 + (n - freq[i]),
  })).sort((a, b) => b.score - a.score);
  return scored[0].digit;
}

function tens2(data: ParsedEntry[], idx: number): number {
  if (idx < 2) return mod10(d(data[idx].bottom, 0) * 3);
  const t = [d(data[idx].bottom, 0), d(data[idx - 1].bottom, 0), d(data[idx - 2].bottom, 0)];
  const d1 = mod10(t[0] - t[1] + 10);
  const d2 = mod10(t[1] - t[2] + 10);
  const accel = mod10(d1 - d2 + 10);
  return mod10(t[0] + mod10(d1 + accel));
}

function tens3(data: ParsedEntry[], idx: number): number {
  return mod10(d(data[idx].bottom, 0) + d(data[idx].bottom, 1) + d(data[idx].top, 0));
}

function tens4(data: ParsedEntry[], idx: number): number {
  return mod10(9 - d(data[idx].bottom, 0));
}

function tens5(data: ParsedEntry[], idx: number): number {
  if (idx < 1) return mod10(d(data[idx].bottom, 0) * 2);
  return mod10(d(data[idx].bottom, 0) + d(data[idx - 1].bottom, 0));
}

/* ═══════ ปักหลักหน่วย 5 สูตร ═══════ */

function units1(data: ParsedEntry[], idx: number): number {
  const u = data.slice(0, idx + 1).map((e) => d(e.bottom, 1));
  const n = u.length;
  const freq = Array(10).fill(0);
  for (let i = 0; i < n; i++) freq[u[i]]++;
  const mean = freq.reduce((a, b) => a + b, 0) / 10;
  const std = Math.sqrt(freq.reduce((s, f) => s + (f - mean) ** 2, 0) / 10) || 1;
  let minZ = Infinity, dead = 0;
  for (let i = 0; i < 10; i++) {
    const z = (freq[i] - mean) / std;
    if (z < minZ) { minZ = z; dead = i; }
  }
  return dead;
}

function units2(data: ParsedEntry[], idx: number): number {
  const u = data.slice(0, idx + 1).map((e) => d(e.bottom, 1));
  const cur = u[u.length - 1];
  const followFreq = Array(10).fill(0);
  for (let i = 0; i < u.length - 1; i++) {
    if (u[i] === cur) followFreq[u[i + 1]]++;
  }
  let minF = Infinity, dead = 0;
  for (let i = 0; i < 10; i++) {
    if (followFreq[i] < minF) { minF = followFreq[i]; dead = i; }
  }
  return dead;
}

function units3(data: ParsedEntry[], idx: number): number {
  if (idx < 1) return mod10(d(data[idx].bottom, 0) * 2 + d(data[idx].top, 0));
  const t0 = d(data[idx].bottom, 0);
  const h0 = d(data[idx].top, 0);
  const t1 = d(data[idx - 1].bottom, 0);
  const u1 = d(data[idx - 1].bottom, 1);
  const h1 = d(data[idx - 1].top, 0);
  return mod10(t0 * 2 + h0 + t1 + u1 + h1);
}

function units4(data: ParsedEntry[], idx: number): number {
  return mod10(9 - d(data[idx].bottom, 1));
}

function units5(data: ParsedEntry[], idx: number): number {
  if (idx < 1) return mod10(d(data[idx].bottom, 1) * 2);
  return mod10(d(data[idx].bottom, 1) + d(data[idx - 1].bottom, 1));
}

/* ═══════ Pair Definitions ═══════ */

interface FormulaPair {
  tensLabel: string;
  unitsLabel: string;
  tensFn: (data: ParsedEntry[], idx: number) => number;
  unitsFn: (data: ParsedEntry[], idx: number) => number;
}

const PAIRS: FormulaPair[] = [
  { tensLabel: "Freq⁻¹+Gap", unitsLabel: "Z-Score", tensFn: tens1, unitsFn: units1 },
  { tensLabel: "Diff Chain", unitsLabel: "Follow Pattern", tensFn: tens2, unitsFn: units2 },
  { tensLabel: "Cross Position", unitsLabel: "Weighted Sum", tensFn: tens3, unitsFn: units3 },
  { tensLabel: "กระจกสิบ", unitsLabel: "กระจกหน่วย", tensFn: tens4, unitsFn: units4 },
  { tensLabel: "สิบ 2 งวดรวม", unitsLabel: "หน่วย 2 งวดรวม", tensFn: tens5, unitsFn: units5 },
];

/* ═══════ Compute ═══════ */

interface PairResult {
  pairIdx: number;
  tensLabel: string;
  unitsLabel: string;
  deadTens: number;
  deadUnits: number;
  deadPair: string;
  pass: number;
  total: number;
  pct: number;
  history: HistoryRow[];
}

interface HistoryRow {
  date: string;
  bottom: string;
  predictedPair: string;
  match: boolean;
}

function computeAll(data: ParsedEntry[]): PairResult[] | null {
  if (data.length < 4) return null;
  const n = data.length;

  return PAIRS.map((pair, pi) => {
    const deadT = pair.tensFn(data, n - 1);
    const deadU = pair.unitsFn(data, n - 1);
    const deadPair = `${deadT}${deadU}`;

    let pass = 0;
    let total = 0;
    const history: HistoryRow[] = [];

    for (let i = 2; i < n - 1; i++) {
      const pt = pair.tensFn(data, i);
      const pu = pair.unitsFn(data, i);
      const predicted = `${pt}${pu}`;
      const actualBottom = data[i + 1].bottom.padStart(2, "0");
      const match = predicted !== actualBottom;
      total++;
      if (match) pass++;

      history.push({
        date: data[i + 1].date,
        bottom: actualBottom,
        predictedPair: predicted,
        match,
      });
    }

    return {
      pairIdx: pi,
      tensLabel: pair.tensLabel,
      unitsLabel: pair.unitsLabel,
      deadTens: deadT,
      deadUnits: deadU,
      deadPair,
      pass,
      total,
      pct: total > 0 ? (pass / total) * 100 : 0,
      history: history.reverse().slice(0, 15),
    };
  });
}

/* ═══════ UI ═══════ */

function tierColor(pct: number) {
  if (pct >= 95) return "from-emerald-600 to-teal-600";
  if (pct >= 90) return "from-blue-600 to-indigo-600";
  if (pct >= 85) return "from-amber-500 to-orange-500";
  return "from-red-500 to-rose-500";
}
function tierBorder(pct: number) {
  if (pct >= 95) return "border-emerald-300";
  if (pct >= 90) return "border-blue-300";
  if (pct >= 85) return "border-amber-300";
  return "border-red-300";
}

export default function Tool029PointDead() {
  return (
    <ToolShell title="ดับคู่ล่างตรงๆ5คู่" minEntries={4}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const results = computeAll(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {results && (
              <div className="animate-[fadeIn_0.5s] space-y-4">

                {/* ─── Explanation ─── */}
                <div className="rounded-xl border border-ink/10 bg-violet-50 px-4 py-3 text-xs text-ink/60 leading-relaxed">
                  <span className="font-bold text-violet-700">วิธีทำนาย:</span>{" "}
                  ปักหลักสิบ 5 สูตร × ปักหลักหน่วย 5 สูตร →
                  จับคู่สูตรที่ 1↔1, 2↔2, … 5↔5 ได้ <b>5 คู่ดับล่าง 2 ตัวตรง</b>{" "}
                  (ผ่าน = เลขล่างจริงไม่ตรงกับคู่ดับ)
                </div>

                {/* ─── 5 Pair Cards ─── */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  {results.map((r) => (
                    <div
                      key={r.pairIdx}
                      className={`rounded-2xl border-2 ${tierBorder(r.pct)} bg-white p-3 text-center shadow-sm`}
                    >
                      <div className="text-[10px] font-bold uppercase text-ink/40">คู่ที่ {r.pairIdx + 1}</div>
                      <div className="mt-0.5 text-[9px] text-ink/30">
                        สิบ: {r.tensLabel}
                      </div>
                      <div className="text-[9px] text-ink/30">
                        หน่วย: {r.unitsLabel}
                      </div>
                      <div className={`mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r ${tierColor(r.pct)} px-5 py-2 shadow-lg`}>
                        <span className="text-4xl font-black text-white tracking-wider">{r.deadPair}</span>
                      </div>
                      <div className="mt-2 text-xs font-bold text-emerald-600">
                        ผ่าน {r.pass}/{r.total} ({r.pct.toFixed(0)}%)
                      </div>
                    </div>
                  ))}
                </div>

                {/* ─── Formula Details ─── */}
                <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
                  <div className="border-b border-ink/10 px-4 py-3 text-sm font-bold text-ink/70">
                    🔢 รายละเอียดสูตร
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-ink/50">
                          <th className="px-3 py-2 text-left">คู่</th>
                          <th className="px-3 py-2 text-center">ปักหลักสิบ</th>
                          <th className="px-3 py-2 text-center">ผลสิบ</th>
                          <th className="px-3 py-2 text-center">ปักหลักหน่วย</th>
                          <th className="px-3 py-2 text-center">ผลหน่วย</th>
                          <th className="px-3 py-2 text-center">คู่ดับ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => (
                          <tr key={r.pairIdx} className="border-t border-ink/5">
                            <td className="px-3 py-2 font-bold text-ink/60">#{r.pairIdx + 1}</td>
                            <td className="px-3 py-2 text-center text-ink/50">{r.tensLabel}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 font-black text-blue-700">{r.deadTens}</span>
                            </td>
                            <td className="px-3 py-2 text-center text-ink/50">{r.unitsLabel}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 font-black text-emerald-700">{r.deadUnits}</span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex rounded-lg bg-violet-100 px-2 py-1 font-black text-violet-700">{r.deadPair}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ─── Copy Button ─── */}
                <button
                  onClick={() => {
                    const txt = results.map((r) => r.deadPair).join(" ");
                    copyText(txt);
                    showToast("คัดลอก: " + txt);
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
                >
                  📋 คัดลอกผลดับ 5 คู่
                </button>

                {/* ─── History per pair ─── */}
                {results.map((r) => (
                  <details key={r.pairIdx} className="rounded-2xl border border-ink/10 bg-white shadow-sm">
                    <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-ink/70 hover:bg-gray-50">
                      📅 คู่ที่ {r.pairIdx + 1} [{r.deadPair}] — ผลย้อนหลัง {r.history.length} งวด
                      <span className="ml-2 text-xs font-normal text-emerald-600">
                        ({r.pct.toFixed(0)}%)
                      </span>
                    </summary>
                    <div className="overflow-x-auto border-t border-ink/10">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-ink/50">
                            <th className="px-3 py-2 text-left">วันที่</th>
                            <th className="px-3 py-2 text-center">ล่างจริง</th>
                            <th className="px-3 py-2 text-center">คู่ดับ</th>
                            <th className="px-3 py-2 text-center">ผล</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.history.map((h, hi) => (
                            <tr key={hi} className={`border-t border-ink/5 ${h.match ? "hover:bg-emerald-50/40" : "hover:bg-red-50/30"}`}>
                              <td className="whitespace-nowrap px-3 py-2 text-ink/60">{h.date}</td>
                              <td className="px-3 py-2 text-center font-black text-ink/80">{h.bottom}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-flex rounded-lg px-2 py-0.5 font-bold ${
                                  h.match ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                                }`}>
                                  {h.predictedPair}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {h.match ? (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">✓ ผ่าน</span>
                                ) : (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">✗ ไม่ผ่าน</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
