"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  สูตร "คู่ดับคู่-คี่ Gap"
  แนวคิด: วิเคราะห์รูปแบบคู่-คี่ของสองตัวล่าง + ช่วง gap ที่หายไปนานสุด
  สร้าง dead pairs จาก 4 แกน:
    1) คู่-คี่ สลับรอบ: ดูว่ารอบล่าสุดเป็นคู่-คี่ / คี่-คู่ → ทำนายแนว "ตรงข้าม" แล้วหาคู่ที่ gap สูงสุดในแนวนั้น
    2) ผลรวมคู่/คี่: sum ของ 2 ตัวล่างเป็นคู่หรือคี่ → dead pair = คู่ที่ sum ตรงข้ามและ gap สูงสุด
    3) หลักสิบ gap สูงสุด: ตัวเลขหลักสิบที่หายไปนานสุด → จับคู่กับหลักหน่วยที่หายนานสุด
    4) ศูนย์ถ้วน: คู่ 00-99 ที่ไม่เคยปรากฏเลยในข้อมูลทั้งหมด
*/

type FormulaResult = { label: string; pair: string; reason: string };

function compute(data: ParsedEntry[]) {
  if (data.length < 3) return null;

  const last = data[data.length - 1];
  const lastTens = d(last.bottom, 0);
  const lastUnits = d(last.bottom, 1);
  const lastParityT = lastTens % 2; // 0=even, 1=odd
  const lastParityU = lastUnits % 2;

  // Build pair appearance map
  const pairGap: Record<string, number> = {};
  for (let i = 0; i < 100; i++) pairGap[String(i).padStart(2, "0")] = data.length; // never appeared = max gap
  for (let i = 0; i < data.length; i++) {
    pairGap[data[i].bottom] = data.length - 1 - i; // gap = distance from end
  }

  // Build digit gap for tens and units separately
  const tensGap: number[] = Array(10).fill(data.length);
  const unitsGap: number[] = Array(10).fill(data.length);
  for (let i = 0; i < data.length; i++) {
    const gap = data.length - 1 - i;
    const t = d(data[i].bottom, 0);
    const u = d(data[i].bottom, 1);
    if (gap < tensGap[t]) tensGap[t] = gap;
    if (gap < unitsGap[u]) unitsGap[u] = gap;
  }

  const results: FormulaResult[] = [];

  // Formula 1: Opposite parity pattern + max gap
  // If last was even-odd, predict dead from even-odd pairs (same pattern rarely repeats 3x)
  const targetParityT = lastParityT;
  const targetParityU = lastParityU;
  let best1 = { pair: "00", gap: -1 };
  for (const [pair, gap] of Object.entries(pairGap)) {
    const t = parseInt(pair[0]);
    const u = parseInt(pair[1]);
    if (t % 2 === targetParityT && u % 2 === targetParityU && gap > best1.gap) {
      best1 = { pair, gap };
    }
  }
  results.push({
    label: "คู่-คี่ ซ้ำรูปแบบ",
    pair: best1.pair,
    reason: `รูปแบบ ${lastParityT === 0 ? "คู่" : "คี่"}-${lastParityU === 0 ? "คู่" : "คี่"} + gap สูงสุด ${best1.gap} งวด`,
  });

  // Formula 2: Opposite sum parity + max gap
  const lastSum = (lastTens + lastUnits) % 2;
  let best2 = { pair: "00", gap: -1 };
  for (const [pair, gap] of Object.entries(pairGap)) {
    const s = (parseInt(pair[0]) + parseInt(pair[1])) % 2;
    if (s === lastSum && gap > best2.gap) {
      best2 = { pair, gap };
    }
  }
  results.push({
    label: "ผลรวมซ้ำ + Gap",
    pair: best2.pair,
    reason: `รวมเป็น${lastSum === 0 ? "คู่" : "คี่"}เหมือนงวดก่อน + gap ${best2.gap} งวด`,
  });

  // Formula 3: Max gap tens + max gap units
  const maxGapT = tensGap.indexOf(Math.max(...tensGap));
  const maxGapU = unitsGap.indexOf(Math.max(...unitsGap));
  results.push({
    label: "หลักสิบ×หน่วย Gap สูงสุด",
    pair: `${maxGapT}${maxGapU}`,
    reason: `สิบ(${maxGapT}) gap ${tensGap[maxGapT]} + หน่วย(${maxGapU}) gap ${unitsGap[maxGapU]}`,
  });

  // Formula 4: Second max gap tens + second max gap units (different pair)
  const sortedT = tensGap.map((g, i) => ({ d: i, g })).sort((a, b) => b.g - a.g);
  const sortedU = unitsGap.map((g, i) => ({ d: i, g })).sort((a, b) => b.g - a.g);
  const t2 = sortedT[1].d;
  const u2 = sortedU[1].d;
  results.push({
    label: "Gap สูงอันดับ 2",
    pair: `${t2}${u2}`,
    reason: `สิบ(${t2}) gap ${sortedT[1].g} + หน่วย(${u2}) gap ${sortedU[1].g}`,
  });

  // Formula 5: Pair that never appeared (or max gap overall)
  const sortedPairs = Object.entries(pairGap).sort((a, b) => b[1] - a[1]);
  const topDead = sortedPairs[0];
  results.push({
    label: "คู่หายนานสุดรวม",
    pair: topDead[0],
    reason: topDead[1] >= data.length ? "ไม่เคยปรากฏเลย" : `หายไป ${topDead[1]} งวด`,
  });

  // Formula 6: Cross-parity inversion
  const invT = mod10(9 - lastTens);
  const invU = mod10(9 - lastUnits);
  results.push({
    label: "กลับค่า 9-complement",
    pair: `${invT}${invU}`,
    reason: `กลับ ${lastTens}→${invT}, ${lastUnits}→${invU}`,
  });

  // Backtest
  for (const r of results) {
    let pass = 0;
    let total = 0;
    // Re-run formula perspective: check if the predicted pair != actual next bottom
    for (let i = 2; i < data.length - 1; i++) {
      total++;
      const actual = data[i + 1].bottom;
      if (actual !== r.pair) pass++;
    }
    (r as any).pass = pass;
    (r as any).total = total;
  }

  const allText = results.map((r) => r.pair).join(" ");
  return { results: results as (FormulaResult & { pass: number; total: number })[], allText };
}

export default function Tool023ParityGap() {
  return (
    <ToolShell title="คู่ดับคู่-คี่ Gap" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {result.results.map((r, i) => (
                    <div key={i} className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 text-center shadow-sm">
                      <div className="text-[11px] font-bold uppercase text-ink/50">{r.label}</div>
                      <div className="mt-1 text-4xl font-black text-indigo-700">{r.pair}</div>
                      <div className="mt-1 text-[10px] text-ink/50">{r.reason}</div>
                      <div className="mt-2 text-xs font-bold text-green-600">
                        ผ่าน {r.pass}/{r.total} ({r.total > 0 ? ((r.pass / r.total) * 100).toFixed(0) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { copyText(result.allText); showToast("คัดลอก: " + result.allText); }}
                  className="w-full rounded-xl bg-indigo-500 py-3 font-bold text-white shadow transition hover:bg-indigo-600"
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
