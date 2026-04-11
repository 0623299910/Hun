"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  สูตร "คู่ดับฟีโบนัชชี"
  แนวคิด: ใช้ลำดับ Fibonacci และ Lucas เป็น offset ดับ
    1) Fibonacci offset: fib(n) mod10 บวกกับสิบ/หน่วยล่าสุด
    2) Lucas offset: lucas(n) mod10 บวกกับสิบ/หน่วยล่าสุด
    3) Fibonacci diff: ผลต่าง fib ของ 2 งวดล่าสุด → dead pair
    4) Tribonacci: sum 3 ตัวก่อนหน้า mod10 → apply กับ สิบ/หน่วย
    5) Anti-Fibonacci: จุดที่ fibonacci sequence บน mod10 ไม่เคยผ่าน
    6) Golden cross: fib(สิบ) × fib(หน่วย) mod10 → dead pair
*/

const FIB = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];
const LUCAS = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843];

function fibMod(n: number): number { return mod10(FIB[Math.abs(n) % FIB.length]); }
function lucMod(n: number): number { return mod10(LUCAS[Math.abs(n) % LUCAS.length]); }

function compute(data: ParsedEntry[]) {
  if (data.length < 3) return null;
  const n = data.length;
  const last = data[n - 1];
  const prev = data[n - 2];
  const t0 = d(last.bottom, 0);
  const u0 = d(last.bottom, 1);
  const t1 = d(prev.bottom, 0);
  const u1 = d(prev.bottom, 1);

  // Use draw count as Fibonacci index
  const fibIdx = n;

  // Formula 1: Fibonacci offset
  const f1t = mod10(t0 + fibMod(fibIdx));
  const f1u = mod10(u0 + fibMod(fibIdx + 1));
  const dead1 = `${f1t}${f1u}`;

  // Formula 2: Lucas offset
  const f2t = mod10(t0 + lucMod(fibIdx));
  const f2u = mod10(u0 + lucMod(fibIdx + 1));
  const dead2 = `${f2t}${f2u}`;

  // Formula 3: Fibonacci diff between draws
  const fibDiffT = mod10(fibMod(t0) - fibMod(t1) + 10);
  const fibDiffU = mod10(fibMod(u0) - fibMod(u1) + 10);
  const dead3 = `${fibDiffT}${fibDiffU}`;

  // Formula 4: Tribonacci (sum last 3 values)
  const prev2 = n >= 3 ? data[n - 3] : prev;
  const t2 = d(prev2.bottom, 0);
  const u2 = d(prev2.bottom, 1);
  const triT = mod10(t0 + t1 + t2);
  const triU = mod10(u0 + u1 + u2);
  const dead4 = `${triT}${triU}`;

  // Formula 5: Anti-Fibonacci zones
  // Generate Fibonacci sequence mod10 and find digits that never appear
  const fibVisited = new Set<number>();
  for (let i = 0; i < 60; i++) fibVisited.add(mod10(FIB[i % FIB.length]));
  // Since fib mod10 cycles are regular, find which (tens,units) combos are rarest
  const pairFibScore: Record<string, number> = {};
  for (let i = 0; i < 100; i++) {
    const pair = String(i).padStart(2, "0");
    const pt = parseInt(pair[0]);
    const pu = parseInt(pair[1]);
    // Score = how far from nearest Fibonacci mod10 value
    let minDistT = 10, minDistU = 10;
    for (const fv of fibVisited) {
      minDistT = Math.min(minDistT, Math.min(Math.abs(pt - fv), 10 - Math.abs(pt - fv)));
      minDistU = Math.min(minDistU, Math.min(Math.abs(pu - fv), 10 - Math.abs(pu - fv)));
    }
    pairFibScore[pair] = minDistT + minDistU;
  }
  // Combine with gap analysis
  const pairGap: Record<string, number> = {};
  for (let i = 0; i < 100; i++) pairGap[String(i).padStart(2, "0")] = n;
  for (let i = 0; i < n; i++) pairGap[data[i].bottom] = Math.min(pairGap[data[i].bottom], n - 1 - i);
  // Dead = highest combined score
  let bestAnti = { pair: "00", score: -1 };
  for (const [pair, fs] of Object.entries(pairFibScore)) {
    const combined = fs * 10 + (pairGap[pair] ?? 0);
    if (combined > bestAnti.score) bestAnti = { pair, score: combined };
  }
  const dead5 = bestAnti.pair;

  // Formula 6: Golden cross
  const gcT = mod10(fibMod(t0) * fibMod(u0));
  const gcU = mod10(fibMod(t0) + fibMod(u0));
  const dead6 = `${gcT}${gcU}`;

  const formulas = [
    { label: "Fibonacci Offset", pair: dead1, method: `สิบ+fib(${fibIdx})=${fibMod(fibIdx)} | หน่วย+fib(${fibIdx + 1})=${fibMod(fibIdx + 1)}` },
    { label: "Lucas Offset", pair: dead2, method: `สิบ+luc(${fibIdx})=${lucMod(fibIdx)} | หน่วย+luc(${fibIdx + 1})=${lucMod(fibIdx + 1)}` },
    { label: "Fibonacci Diff", pair: dead3, method: `fib(${t0})-fib(${t1}) | fib(${u0})-fib(${u1})` },
    { label: "Tribonacci Sum", pair: dead4, method: `สิบ(${t0}+${t1}+${t2}) | หน่วย(${u0}+${u1}+${u2})` },
    { label: "Anti-Fibonacci Zone", pair: dead5, method: `คู่ที่ห่าง Fibonacci มากสุด + gap สูงสุด` },
    { label: "Golden Cross", pair: dead6, method: `fib(สิบ)×fib(หน่วย) | fib(สิบ)+fib(หน่วย)` },
  ];

  // Backtest
  const bt = formulas.map((f) => ({ ...f, pass: 0, total: 0 }));
  for (let i = 2; i < n - 1; i++) {
    const cl = data[i];
    const cp = data[i - 1];
    const cp2 = i >= 2 ? data[i - 2] : cp;
    const actual = data[i + 1].bottom;
    const ct0 = d(cl.bottom, 0), cu0 = d(cl.bottom, 1);
    const ct1 = d(cp.bottom, 0), cu1 = d(cp.bottom, 1);
    const ct2 = d(cp2.bottom, 0), cu2 = d(cp2.bottom, 1);
    const ci = i + 1; // draw count at that point

    const preds = [
      `${mod10(ct0 + fibMod(ci))}${mod10(cu0 + fibMod(ci + 1))}`,
      `${mod10(ct0 + lucMod(ci))}${mod10(cu0 + lucMod(ci + 1))}`,
      `${mod10(fibMod(ct0) - fibMod(ct1) + 10)}${mod10(fibMod(cu0) - fibMod(cu1) + 10)}`,
      `${mod10(ct0 + ct1 + ct2)}${mod10(cu0 + cu1 + cu2)}`,
      dead5, // global analysis
      `${mod10(fibMod(ct0) * fibMod(cu0))}${mod10(fibMod(ct0) + fibMod(cu0))}`,
    ];

    for (let f = 0; f < 6; f++) {
      bt[f].total++;
      if (actual !== preds[f]) bt[f].pass++;
    }
  }

  const allText = bt.map((r) => r.pair).join(" ");
  return { results: bt, allText };
}

export default function Tool028FibonacciDead() {
  return (
    <ToolShell title="คู่ดับฟีโบนัชชี" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {result.results.map((r, i) => (
                    <div key={i} className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 text-center shadow-sm">
                      <div className="text-[11px] font-bold uppercase text-ink/50">{r.label}</div>
                      <div className="mt-1 text-4xl font-black text-orange-700">{r.pair}</div>
                      <div className="mt-1 text-[10px] text-ink/50">{r.method}</div>
                      <div className="mt-2 text-xs font-bold text-green-600">
                        ผ่าน {r.pass}/{r.total} ({r.total > 0 ? ((r.pass / r.total) * 100).toFixed(0) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { copyText(result.allText); showToast("คัดลอก: " + result.allText); }}
                  className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white shadow transition hover:bg-orange-600"
                >
                  📋 คัดลอกคู่ดับทั้งหมด
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
