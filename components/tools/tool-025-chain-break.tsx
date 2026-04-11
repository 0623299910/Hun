"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  สูตร "คู่ดับโซ่ขาด"
  แนวคิด: วิเคราะห์ "โซ่" ของตัวเลขที่ต่อเนื่องกัน แล้วหาจุดที่โซ่ขาด
    1) โซ่สิบ: ดูว่าหลักสิบเปลี่ยนแปลงอย่างไรในแต่ละงวด (diff) → ทำนายตัวถัดไปจาก pattern แล้วกลับด้าน
    2) โซ่หน่วย: เหมือนกันแต่หลักหน่วย
    3) โซ่ผลต่าง: diff(สิบ) + diff(หน่วย) ของ 3 งวดสุดท้าย → หาคู่ที่ "ไม่ตาม pattern"
    4) โซ่ข้าม: สิบ(n) → หน่วย(n+1) → สิบ(n+2) pattern → dead = ตรงข้าม
    5) โซ่สะสม: running sum ของ สิบ+หน่วย mod 10 ในแต่ละงวด → dead = ค่าที่ไม่เคยตกลงมา
    6) โซ่วนเวียน: วิเคราะห์ cycle length ของหลักสิบและหน่วย → ทำนาย dead จาก anticycle
*/

function compute(data: ParsedEntry[]) {
  if (data.length < 4) return null;
  const n = data.length;

  const tens = data.map((e) => d(e.bottom, 0));
  const units = data.map((e) => d(e.bottom, 1));

  // Helper: diff array
  const diffs = (arr: number[]) => arr.slice(1).map((v, i) => mod10(v - arr[i] + 10));

  const tensDiff = diffs(tens);
  const unitsDiff = diffs(units);

  // Formula 1: Predict next tens from last 2 diffs pattern, then invert
  const lastTDiff1 = tensDiff[tensDiff.length - 1];
  const lastTDiff2 = tensDiff.length >= 2 ? tensDiff[tensDiff.length - 2] : 0;
  const predictedDiffT = mod10(lastTDiff1 + (lastTDiff1 - lastTDiff2));
  const deadTens1 = mod10(tens[n - 1] + predictedDiffT);

  const lastUDiff1 = unitsDiff[unitsDiff.length - 1];
  const lastUDiff2 = unitsDiff.length >= 2 ? unitsDiff[unitsDiff.length - 2] : 0;
  const predictedDiffU = mod10(lastUDiff1 + (lastUDiff1 - lastUDiff2));
  const deadUnits1 = mod10(units[n - 1] + predictedDiffU);

  // Formula 2: Simple continuation dead (if pattern keeps going, it won't)
  const deadTens2 = mod10(tens[n - 1] + lastTDiff1);
  const deadUnits2 = mod10(units[n - 1] + lastUDiff1);

  // Formula 3: Diff of diffs (acceleration)
  const accelT = mod10(lastTDiff1 - lastTDiff2 + 10);
  const accelU = mod10(lastUDiff1 - lastUDiff2 + 10);
  const deadTens3 = mod10(tens[n - 1] + lastTDiff1 + accelT);
  const deadUnits3 = mod10(units[n - 1] + lastUDiff1 + accelU);

  // Formula 4: Cross-chain
  const crossT = units[n - 1]; // unit of last becomes "predicted tens"
  const crossU = tens[n - 1]; // tens of last becomes "predicted units"
  const dead4 = `${mirr10(crossT)}${mirr10(crossU)}`;

  // Formula 5: Running sum dead
  const runningSums: number[] = [];
  let rSum = 0;
  for (let i = 0; i < n; i++) {
    rSum = mod10(rSum + tens[i] + units[i]);
    runningSums.push(rSum);
  }
  const predictedRS = mod10(rSum + tens[n - 1] + units[n - 1]);
  const dead5t = mod10(predictedRS);
  const dead5u = mod10(9 - predictedRS);

  // Formula 6: Cycle detection
  const findCycleLen = (arr: number[]) => {
    for (let cl = 2; cl <= Math.min(arr.length - 1, 10); cl++) {
      let match = true;
      for (let k = 0; k < cl && n - 1 - k >= cl; k++) {
        if (arr[n - 1 - k] !== arr[n - 1 - k - cl]) { match = false; break; }
      }
      if (match) return cl;
    }
    return 0;
  };
  const cycleT = findCycleLen(tens);
  const cycleU = findCycleLen(units);
  const dead6t = cycleT > 0 ? mod10(9 - tens[n - 1 - cycleT]) : mod10(9 - tens[n - 1]);
  const dead6u = cycleU > 0 ? mod10(9 - units[n - 1 - cycleU]) : mod10(9 - units[n - 1]);

  const formulas = [
    { label: "โซ่สิบ-หน่วย ทำนาย", pair: `${deadTens1}${deadUnits1}`, method: `diff² pattern: สิบ→${deadTens1}, หน่วย→${deadUnits1}` },
    { label: "โซ่ต่อเนื่อง", pair: `${deadTens2}${deadUnits2}`, method: `ต่อจาก diff ล่าสุด: +${lastTDiff1},+${lastUDiff1}` },
    { label: "โซ่เร่ง (ความเร่ง)", pair: `${deadTens3}${deadUnits3}`, method: `diff+accel: สิบ(${accelT}) หน่วย(${accelU})` },
    { label: "โซ่ข้ามตำแหน่ง", pair: dead4, method: `สลับ+กระจก: ${crossT}↔${crossU}` },
    { label: "โซ่ผลรวมสะสม", pair: `${dead5t}${dead5u}`, method: `running sum ${rSum} → ${predictedRS}` },
    { label: "โซ่วงจร", pair: `${dead6t}${dead6u}`, method: `cycle สิบ(${cycleT || "∞"}) หน่วย(${cycleU || "∞"}) → กลับด้าน` },
  ];

  // Backtest
  const bt = formulas.map((f) => ({ ...f, pass: 0, total: 0 }));
  for (let i = 3; i < n - 1; i++) {
    const actual = data[i + 1].bottom;
    const lTens = data.slice(0, i + 1).map((e) => d(e.bottom, 0));
    const lUnits = data.slice(0, i + 1).map((e) => d(e.bottom, 1));
    const ld = (arr: number[]) => arr.slice(1).map((v, j) => mod10(v - arr[j] + 10));
    const ltd = ld(lTens);
    const lud = ld(lUnits);
    const ltd1 = ltd[ltd.length - 1];
    const ltd2 = ltd.length >= 2 ? ltd[ltd.length - 2] : 0;
    const lud1 = lud[lud.length - 1];
    const lud2 = lud.length >= 2 ? lud[lud.length - 2] : 0;

    const preds = [
      `${mod10(lTens[i] + mod10(ltd1 + (ltd1 - ltd2)))}${mod10(lUnits[i] + mod10(lud1 + (lud1 - lud2)))}`,
      `${mod10(lTens[i] + ltd1)}${mod10(lUnits[i] + lud1)}`,
      `${mod10(lTens[i] + ltd1 + mod10(ltd1 - ltd2 + 10))}${mod10(lUnits[i] + lud1 + mod10(lud1 - lud2 + 10))}`,
      `${mirr10(lUnits[i])}${mirr10(lTens[i])}`,
      (() => { let s = 0; for (let j = 0; j <= i; j++) s = mod10(s + lTens[j] + lUnits[j]); const ps = mod10(s + lTens[i] + lUnits[i]); return `${mod10(ps)}${mod10(9 - ps)}`; })(),
      `${mod10(9 - lTens[i])}${mod10(9 - lUnits[i])}`,
    ];

    for (let f = 0; f < 6; f++) {
      bt[f].total++;
      if (actual !== preds[f]) bt[f].pass++;
    }
  }

  const allText = bt.map((r) => r.pair).join(" ");
  return { results: bt, allText };
}

function mirr10(x: number) { return mod10(9 - x); }

export default function Tool025ChainBreak() {
  return (
    <ToolShell title="คู่ดับโซ่ขาด" minEntries={4}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {result.results.map((r, i) => (
                    <div key={i} className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 text-center shadow-sm">
                      <div className="text-[11px] font-bold uppercase text-ink/50">{r.label}</div>
                      <div className="mt-1 text-4xl font-black text-amber-700">{r.pair}</div>
                      <div className="mt-1 text-[10px] text-ink/50">{r.method}</div>
                      <div className="mt-2 text-xs font-bold text-green-600">
                        ผ่าน {r.pass}/{r.total} ({r.total > 0 ? ((r.pass / r.total) * 100).toFixed(0) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { copyText(result.allText); showToast("คัดลอก: " + result.allText); }}
                  className="w-full rounded-xl bg-amber-500 py-3 font-bold text-white shadow transition hover:bg-amber-600"
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
