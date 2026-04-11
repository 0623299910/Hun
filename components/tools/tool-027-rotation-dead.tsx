"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  สูตร "คู่ดับหมุนวน"
  แนวคิด: หมุนตำแหน่งตัวเลขข้ามหลายงวดเป็นวงกลม แล้วหาจุดตายจาก rotation
    1) หมุนขวา: สิบ(n) → ตำแหน่งหน่วย, หน่วย(n-1) → ตำแหน่งสิบ ของงวดถัดไป → dead = inverse
    2) หมุนซ้าย: หน่วย(n) → สิบ, สิบ(n-1) → หน่วย → dead = inverse
    3) หมุน 3 งวด: (สิบ(n-2), หน่วย(n-1), สิบ(n)) mod10 → ตัวที่ 4,5 ในวงจร → dead
    4) winding number: นับจำนวนรอบที่หลักสิบหมุนผ่าน 0 ใน N งวดล่าสุด → dead = ตำแหน่งที่ห่างจาก winding
    5) phase shift: (สิบ × golden_ratio_approx) mod10 | (หน่วย × golden_ratio_approx) mod10
    6) angular dead: แปลง สิบ,หน่วย เป็นมุม (×36°) → หามุมที่ว่างมากที่สุด → แปลงกลับเป็นคู่
*/

function compute(data: ParsedEntry[]) {
  if (data.length < 4) return null;
  const n = data.length;
  const tens = data.map((e) => d(e.bottom, 0));
  const units = data.map((e) => d(e.bottom, 1));

  // Formula 1: Rotate right
  const rot1t = units[n - 1];
  const rot1u = tens[n - 2];
  const dead1 = `${mod10(9 - rot1t)}${mod10(9 - rot1u)}`;

  // Formula 2: Rotate left
  const rot2t = units[n - 2];
  const rot2u = tens[n - 1];
  const dead2 = `${mod10(9 - rot2t)}${mod10(9 - rot2u)}`;

  // Formula 3: Three-draw spiral
  const spiral = [tens[n - 3], units[n - 2], tens[n - 1]];
  const diff1 = mod10(spiral[1] - spiral[0] + 10);
  const diff2 = mod10(spiral[2] - spiral[1] + 10);
  const avgDiff = mod10(Math.round((diff1 + diff2) / 2));
  const next1 = mod10(spiral[2] + avgDiff);
  const next2 = mod10(next1 + avgDiff);
  const dead3 = `${next1}${next2}`;

  // Formula 4: Winding number analysis
  let windCount = 0;
  const window = Math.min(n, 20);
  for (let i = n - window; i < n - 1; i++) {
    if (tens[i] > 7 && tens[i + 1] < 3) windCount++;
    if (tens[i] < 3 && tens[i + 1] > 7) windCount--;
  }
  const windOffset = mod10(Math.abs(windCount) * 3);
  const dead4 = `${mod10(tens[n - 1] + windOffset)}${mod10(units[n - 1] + windOffset)}`;

  // Formula 5: Phase shift (golden ratio ≈ 1.618, use 16/10 = 8/5)
  const phiT = mod10(Math.floor(tens[n - 1] * 1.618));
  const phiU = mod10(Math.floor(units[n - 1] * 1.618));
  const dead5 = `${phiT}${phiU}`;

  // Formula 6: Angular dead zone
  // Map each bottom to angle, find the largest gap in angle space
  const angles: boolean[] = Array(100).fill(false);
  for (const e of data) {
    angles[parseInt(e.bottom)] = true;
  }
  let maxGapStart = 0;
  let maxGapLen = 0;
  let currentStart = -1;
  let currentLen = 0;
  for (let i = 0; i < 200; i++) {
    // wrap around
    if (!angles[i % 100]) {
      if (currentLen === 0) currentStart = i % 100;
      currentLen++;
      if (currentLen > maxGapLen) {
        maxGapLen = currentLen;
        maxGapStart = currentStart;
      }
    } else {
      currentLen = 0;
    }
  }
  const deadCenter = (maxGapStart + Math.floor(maxGapLen / 2)) % 100;
  const dead6 = String(deadCenter).padStart(2, "0");

  const formulas = [
    { label: "หมุนขวา", pair: dead1, method: `กลับด้าน(หน่วย→สิบ, สิบ(n-1)→หน่วย)` },
    { label: "หมุนซ้าย", pair: dead2, method: `กลับด้าน(หน่วย(n-1)→สิบ, สิบ→หน่วย)` },
    { label: "เกลียว 3 งวด", pair: dead3, method: `${spiral.join("→")} diff(${diff1},${diff2}) → ${next1}${next2}` },
    { label: "Winding Number", pair: dead4, method: `รอบหมุน=${windCount}, offset=${windOffset}` },
    { label: "Phase Shift (φ)", pair: dead5, method: `สิบ×φ=${phiT}, หน่วย×φ=${phiU}` },
    { label: "Angular Dead Zone", pair: dead6, method: `ช่องว่างใหญ่สุด: เริ่ม ${maxGapStart} ยาว ${maxGapLen}` },
  ];

  // Backtest
  const bt = formulas.map((f) => ({ ...f, pass: 0, total: 0 }));
  for (let i = 3; i < n - 1; i++) {
    const actual = data[i + 1].bottom;
    const lTens = data.slice(0, i + 1).map((e) => d(e.bottom, 0));
    const lUnits = data.slice(0, i + 1).map((e) => d(e.bottom, 1));
    const li = i; // last index in slice

    const sp = [lTens[li - 2], lUnits[li - 1], lTens[li]];
    const sd1 = mod10(sp[1] - sp[0] + 10);
    const sd2 = mod10(sp[2] - sp[1] + 10);
    const savg = mod10(Math.round((sd1 + sd2) / 2));

    let wc = 0;
    const ww = Math.min(li + 1, 20);
    for (let j = li + 1 - ww; j < li; j++) {
      if (lTens[j] > 7 && lTens[j + 1] < 3) wc++;
      if (lTens[j] < 3 && lTens[j + 1] > 7) wc--;
    }
    const wo = mod10(Math.abs(wc) * 3);

    const preds = [
      `${mod10(9 - lUnits[li])}${mod10(9 - lTens[li - 1])}`,
      `${mod10(9 - lUnits[li - 1])}${mod10(9 - lTens[li])}`,
      `${mod10(sp[2] + savg)}${mod10(sp[2] + savg + savg)}`,
      `${mod10(lTens[li] + wo)}${mod10(lUnits[li] + wo)}`,
      `${mod10(Math.floor(lTens[li] * 1.618))}${mod10(Math.floor(lUnits[li] * 1.618))}`,
      dead6, // angular dead zone is global, doesn't change per draw
    ];

    for (let f = 0; f < 6; f++) {
      bt[f].total++;
      if (actual !== preds[f]) bt[f].pass++;
    }
  }

  const allText = bt.map((r) => r.pair).join(" ");
  return { results: bt, allText };
}

export default function Tool027Rotation() {
  return (
    <ToolShell title="คู่ดับหมุนวน" minEntries={4}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {result.results.map((r, i) => (
                    <div key={i} className="rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 text-center shadow-sm">
                      <div className="text-[11px] font-bold uppercase text-ink/50">{r.label}</div>
                      <div className="mt-1 text-4xl font-black text-violet-700">{r.pair}</div>
                      <div className="mt-1 text-[10px] text-ink/50">{r.method}</div>
                      <div className="mt-2 text-xs font-bold text-green-600">
                        ผ่าน {r.pass}/{r.total} ({r.total > 0 ? ((r.pass / r.total) * 100).toFixed(0) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { copyText(result.allText); showToast("คัดลอก: " + result.allText); }}
                  className="w-full rounded-xl bg-violet-500 py-3 font-bold text-white shadow transition hover:bg-violet-600"
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
