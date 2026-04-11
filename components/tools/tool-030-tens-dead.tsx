"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  สูตร "ดับหลักสิบล่าง 3 สูตร"
  หลักสิบ = ตัวแรกของสองตัวล่าง (bottom[0])
  ทำนายว่าหลักสิบตัวไหน (0-9) ไม่ควรมาในงวดถัดไป
    สูตร 1: Frequency Inverse + Gap — หาหลักสิบที่ frequency ต่ำสุดและ gap สูงสุด
    สูตร 2: Diff Chain — ดูผลต่างหลักสิบ 3 งวดล่าสุด → ทำนายตามแนวโน้ม → dead = ค่าที่ทำนายได้ (มักจะไม่มาซ้ำ)
    สูตร 3: Cross Position — หลักสิบ + หน่วยล่าง + หลักร้อย mod 10 → dead
*/

function compute(data: ParsedEntry[]) {
  if (data.length < 3) return null;
  const n = data.length;

  const tens = data.map((e) => d(e.bottom, 0));

  // Frequency & gap
  const freq = Array(10).fill(0);
  const lastSeen = Array(10).fill(-1);
  for (let i = 0; i < n; i++) {
    freq[tens[i]]++;
    lastSeen[tens[i]] = i;
  }
  const gap = lastSeen.map((ls) => (ls === -1 ? n : n - 1 - ls));

  // --- สูตร 1: Frequency Inverse + Gap ---
  const score1 = Array.from({ length: 10 }, (_, i) => ({
    digit: i,
    score: gap[i] * 2 + (n - freq[i]),
  })).sort((a, b) => b.score - a.score);
  const dead1 = score1[0].digit;

  // --- สูตร 2: Diff Chain ---
  const d1 = mod10(tens[n - 1] - tens[n - 2] + 10);
  const d2 = mod10(tens[n - 2] - tens[n - 3] + 10);
  const accel = mod10(d1 - d2 + 10);
  const predictedDiff = mod10(d1 + accel);
  const dead2 = mod10(tens[n - 1] + predictedDiff);

  // --- สูตร 3: Cross Position ---
  const u0 = d(data[n - 1].bottom, 1);
  const h0 = d(data[n - 1].top, 0);
  const dead3 = mod10(tens[n - 1] + u0 + h0);

  const formulas = [
    { label: "Freq⁻¹ + Gap สูงสุด", dead: dead1, method: `score = gap×2 + (N-freq), สูงสุด = ${dead1} (gap=${gap[dead1]}, freq=${freq[dead1]})` },
    { label: "Diff Chain + ความเร่ง", dead: dead2, method: `diff(${d1},${d2}) accel=${accel} → +${predictedDiff} → ${dead2}` },
    { label: "Cross ตำแหน่ง", dead: dead3, method: `สิบ(${tens[n - 1]})+หน่วย(${u0})+ร้อย(${h0}) = ${dead3}` },
  ];

  // Backtest
  const bt = formulas.map((f) => ({ ...f, pass: 0, total: 0 }));
  for (let i = 2; i < n - 1; i++) {
    const lTens = data.slice(0, i + 1).map((e) => d(e.bottom, 0));
    const actualTens = d(data[i + 1].bottom, 0);
    const li = i;

    // freq & gap up to i
    const lf = Array(10).fill(0);
    const lls = Array(10).fill(-1);
    for (let j = 0; j <= li; j++) { lf[lTens[j]]++; lls[lTens[j]] = j; }
    const lg = lls.map((ls2) => (ls2 === -1 ? li + 1 : li - ls2));

    const ls1 = Array.from({ length: 10 }, (_, idx) => ({
      digit: idx,
      score: lg[idx] * 2 + (li + 1 - lf[idx]),
    })).sort((a, b) => b.score - a.score);
    const ld1 = ls1[0].digit;

    const ld1d = mod10(lTens[li] - lTens[li - 1] + 10);
    const ld2d = mod10(lTens[li - 1] - lTens[li - 2] + 10);
    const lacc = mod10(ld1d - ld2d + 10);
    const lpdiff = mod10(ld1d + lacc);
    const ld2 = mod10(lTens[li] + lpdiff);

    const lu0 = d(data[i].bottom, 1);
    const lh0 = d(data[i].top, 0);
    const ld3 = mod10(lTens[li] + lu0 + lh0);

    const preds = [ld1, ld2, ld3];
    for (let f = 0; f < 3; f++) {
      bt[f].total++;
      if (actualTens !== preds[f]) bt[f].pass++;
    }
  }

  const allText = bt.map((r) => r.dead).join(" ");
  return { results: bt, allText, lastTens: tens[n - 1] };
}

export default function Tool030TensDead() {
  return (
    <ToolShell title="ดับหลักสิบล่าง 3 สูตร" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                <div className="text-center text-sm text-ink/60">
                  หลักสิบงวดล่าสุด = <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">{result.lastTens}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {result.results.map((r, i) => (
                    <div key={i} className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 text-center shadow-sm">
                      <div className="text-[11px] font-bold uppercase text-ink/50">สูตร {i + 1}</div>
                      <div className="text-[10px] text-ink/40">{r.label}</div>
                      <div className="mt-2 text-5xl font-black text-blue-600">{r.dead}</div>
                      <div className="mt-1 text-[10px] text-ink/50">{r.method}</div>
                      <div className="mt-2 text-xs font-bold text-green-600">
                        ผ่าน {r.pass}/{r.total} ({r.total > 0 ? ((r.pass / r.total) * 100).toFixed(0) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { copyText(result.allText); showToast("คัดลอก: " + result.allText); }}
                  className="w-full rounded-xl bg-blue-500 py-3 font-bold text-white shadow transition hover:bg-blue-600"
                >
                  📋 คัดลอกผลดับหลักสิบ
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
