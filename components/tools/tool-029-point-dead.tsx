"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  สูตร "ดับแต้มล่าง 3 สูตร"
  แต้ม = (หลักสิบ + หลักหน่วย) ของสองตัวล่าง mod 10
  ทำนายว่าแต้มตัวไหน (0-9) ไม่ควรมาในงวดถัดไป
    สูตร 1: Trend + Gap — หาแต้มที่ gap สูงสุด + ไม่ตรงกับ trend 3 งวดล่าสุด
    สูตร 2: Mirror Point — กระจกแต้มล่าสุด (9 - แต้ม) + เฉลี่ยแต้ม 3 งวด
    สูตร 3: Cross Hundred — แต้ม + หลักร้อย mod 10 ของงวดล่าสุด → dead
*/

function compute(data: ParsedEntry[]) {
  if (data.length < 3) return null;
  const n = data.length;

  const points = data.map((e) => mod10(d(e.bottom, 0) + d(e.bottom, 1)));

  // Frequency & gap for each point value 0-9
  const freq = Array(10).fill(0);
  const lastSeen = Array(10).fill(-1);
  for (let i = 0; i < n; i++) {
    freq[points[i]]++;
    lastSeen[points[i]] = i;
  }
  const gap = lastSeen.map((ls) => (ls === -1 ? n : n - 1 - ls));

  // --- สูตร 1: Trend + Gap ---
  // trend = ผลต่างแต้ม 3 งวดล่าสุด
  const diffs = [mod10(points[n - 1] - points[n - 2] + 10), mod10(points[n - 2] - points[n - 3] + 10)];
  const trendPredict = mod10(points[n - 1] + diffs[0]); // ถ้า trend ต่อ จะได้ค่านี้
  // dead = ค่าที่ gap สูงสุด แต่ไม่ใช่ trend predict
  const sorted1 = gap.map((g, i) => ({ digit: i, gap: g })).sort((a, b) => b.gap - a.gap);
  const dead1 = sorted1.find((x) => x.digit !== trendPredict)?.digit ?? sorted1[0].digit;

  // --- สูตร 2: Mirror Point ---
  const mirrorLast = mod10(9 - points[n - 1]);
  const avg3 = mod10(Math.round((points[n - 1] + points[n - 2] + points[n - 3]) / 3));
  const mirrorAvg = mod10(9 - avg3);
  // เลือกตัวที่ gap สูงกว่าระหว่าง mirror กับ mirrorAvg
  const dead2 = gap[mirrorLast] >= gap[mirrorAvg] ? mirrorLast : mirrorAvg;

  // --- สูตร 3: Cross Hundred ---
  const h0 = d(data[n - 1].top, 0);
  const crossVal = mod10(points[n - 1] + h0);
  const dead3 = crossVal;

  const formulas = [
    { label: "Trend + Gap สูงสุด", dead: dead1, method: `trend→${trendPredict} + gap สูงสุดที่เหลือ (gap=${gap[dead1]})` },
    { label: "Mirror แต้ม", dead: dead2, method: `mirror(${points[n - 1]})=${mirrorLast}, mirror(avg ${avg3})=${mirrorAvg}` },
    { label: "Cross หลักร้อย", dead: dead3, method: `แต้ม(${points[n - 1]}) + หลักร้อย(${h0}) = ${crossVal}` },
  ];

  // Backtest
  const bt = formulas.map((f) => ({ ...f, pass: 0, total: 0 }));
  for (let i = 2; i < n - 1; i++) {
    const pts = data.slice(0, i + 1).map((e) => mod10(d(e.bottom, 0) + d(e.bottom, 1)));
    const actualPoint = mod10(d(data[i + 1].bottom, 0) + d(data[i + 1].bottom, 1));
    const li = i;

    const ld = [mod10(pts[li] - pts[li - 1] + 10), mod10(pts[li - 1] - pts[li - 2] + 10)];
    const ltp = mod10(pts[li] + ld[0]);
    const lgap = Array(10).fill(li + 1);
    const lls = Array(10).fill(-1);
    for (let j = 0; j <= li; j++) { lls[pts[j]] = j; }
    for (let d2 = 0; d2 < 10; d2++) lgap[d2] = lls[d2] === -1 ? li + 1 : li - lls[d2];
    const ls1 = lgap.map((g, idx) => ({ digit: idx, gap: g })).sort((a, b) => b.gap - a.gap);
    const ld1 = ls1.find((x) => x.digit !== ltp)?.digit ?? ls1[0].digit;

    const lmirr = mod10(9 - pts[li]);
    const lavg = mod10(Math.round((pts[li] + pts[li - 1] + pts[li - 2]) / 3));
    const lmirravg = mod10(9 - lavg);
    const ld2 = lgap[lmirr] >= lgap[lmirravg] ? lmirr : lmirravg;

    const lh = d(data[i].top, 0);
    const ld3 = mod10(pts[li] + lh);

    const preds = [ld1, ld2, ld3];
    for (let f = 0; f < 3; f++) {
      bt[f].total++;
      if (actualPoint !== preds[f]) bt[f].pass++;
    }
  }

  const allText = bt.map((r) => r.dead).join(" ");
  return { results: bt, allText, lastPoint: points[n - 1] };
}

export default function Tool029PointDead() {
  return (
    <ToolShell title="ดับแต้มล่าง 3 สูตร" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                <div className="text-center text-sm text-ink/60">
                  แต้มงวดล่าสุด = <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-lg font-bold text-white">{result.lastPoint}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {result.results.map((r, i) => (
                    <div key={i} className="rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 text-center shadow-sm">
                      <div className="text-[11px] font-bold uppercase text-ink/50">สูตร {i + 1}</div>
                      <div className="text-[10px] text-ink/40">{r.label}</div>
                      <div className="mt-2 text-5xl font-black text-rose-600">{r.dead}</div>
                      <div className="mt-1 text-[10px] text-ink/50">{r.method}</div>
                      <div className="mt-2 text-xs font-bold text-green-600">
                        ผ่าน {r.pass}/{r.total} ({r.total > 0 ? ((r.pass / r.total) * 100).toFixed(0) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { copyText(result.allText); showToast("คัดลอก: " + result.allText); }}
                  className="w-full rounded-xl bg-rose-500 py-3 font-bold text-white shadow transition hover:bg-rose-600"
                >
                  📋 คัดลอกผลดับแต้ม
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
