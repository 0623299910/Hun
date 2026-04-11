"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  สูตร "ดับหลักหน่วยล่าง 3 สูตร"
  หลักหน่วย = ตัวที่สองของสองตัวล่าง (bottom[1])
  ทำนายว่าหลักหน่วยตัวไหน (0-9) ไม่ควรมาในงวดถัดไป
    สูตร 1: Z-Score หลักหน่วย — หาตัวที่ Z-Score ต่ำสุด (ต่ำกว่าค่าเฉลี่ยมาก)
    สูตร 2: Follow Pattern — ดูว่าเมื่อหลักหน่วยเป็น X แล้ว งวดถัดไปมักจะ "ไม่เป็น" อะไร
    สูตร 3: Weighted Sum — ถ่วงน้ำหนักจาก สิบ+หน่วย+ร้อย ของ 2 งวดล่าสุด
*/

function compute(data: ParsedEntry[]) {
  if (data.length < 3) return null;
  const n = data.length;

  const units = data.map((e) => d(e.bottom, 1));

  // Frequency & gap
  const freq = Array(10).fill(0);
  const lastSeen = Array(10).fill(-1);
  for (let i = 0; i < n; i++) {
    freq[units[i]]++;
    lastSeen[units[i]] = i;
  }
  const gap = lastSeen.map((ls) => (ls === -1 ? n : n - 1 - ls));

  // --- สูตร 1: Z-Score ---
  const mean = freq.reduce((a, b) => a + b, 0) / 10;
  const std = Math.sqrt(freq.reduce((s, f) => s + (f - mean) ** 2, 0) / 10) || 1;
  const zScores = freq.map((f) => (f - mean) / std);
  // Dead = ตัวที่ Z-Score ต่ำสุด (มาน้อยที่สุดเชิงสถิติ)
  let minZ = Infinity;
  let dead1 = 0;
  for (let i = 0; i < 10; i++) {
    if (zScores[i] < minZ) { minZ = zScores[i]; dead1 = i; }
  }

  // --- สูตร 2: Follow Pattern ---
  // ดูว่าเมื่อหลักหน่วยงวดก่อน = X แล้วงวดถัดไปหลักหน่วยไม่เคยเป็นอะไร
  const currentUnit = units[n - 1];
  const followFreq = Array(10).fill(0);
  for (let i = 0; i < n - 1; i++) {
    if (units[i] === currentUnit) {
      followFreq[units[i + 1]]++;
    }
  }
  // dead = ตัวที่ follow freq ต่ำสุด
  let minFollow = Infinity;
  let dead2 = 0;
  for (let i = 0; i < 10; i++) {
    if (followFreq[i] < minFollow) { minFollow = followFreq[i]; dead2 = i; }
  }

  // --- สูตร 3: Weighted Sum ---
  const t0 = d(data[n - 1].bottom, 0);
  const h0 = d(data[n - 1].top, 0);
  const t1 = d(data[n - 2].bottom, 0);
  const u1 = d(data[n - 2].bottom, 1);
  const h1 = d(data[n - 2].top, 0);
  const dead3 = mod10(t0 * 2 + h0 + t1 + u1 + h1);

  const formulas = [
    { label: "Z-Score ต่ำสุด", dead: dead1, method: `Z(${dead1}) = ${minZ.toFixed(2)} (freq=${freq[dead1]})` },
    { label: "Follow Pattern", dead: dead2, method: `เมื่อหน่วย=${currentUnit} → ตามด้วย ${dead2} แค่ ${minFollow} ครั้ง` },
    { label: "Weighted Sum", dead: dead3, method: `สิบ×2(${t0})+ร้อย(${h0})+สิบก่อน(${t1})+หน่วยก่อน(${u1})+ร้อยก่อน(${h1})` },
  ];

  // Backtest
  const bt = formulas.map((f) => ({ ...f, pass: 0, total: 0 }));
  for (let i = 2; i < n - 1; i++) {
    const lUnits = data.slice(0, i + 1).map((e) => d(e.bottom, 1));
    const actualUnit = d(data[i + 1].bottom, 1);
    const li = i;

    // Z-Score
    const lf = Array(10).fill(0);
    for (let j = 0; j <= li; j++) lf[lUnits[j]]++;
    const lm = lf.reduce((a, b) => a + b, 0) / 10;
    const ls = Math.sqrt(lf.reduce((s2, f2) => s2 + (f2 - lm) ** 2, 0) / 10) || 1;
    const lz = lf.map((f2) => (f2 - lm) / ls);
    let lminZ = Infinity, ld1 = 0;
    for (let j = 0; j < 10; j++) { if (lz[j] < lminZ) { lminZ = lz[j]; ld1 = j; } }

    // Follow
    const cu = lUnits[li];
    const lff = Array(10).fill(0);
    for (let j = 0; j < li; j++) { if (lUnits[j] === cu) lff[lUnits[j + 1]]++; }
    let lmf = Infinity, ld2 = 0;
    for (let j = 0; j < 10; j++) { if (lff[j] < lmf) { lmf = lff[j]; ld2 = j; } }

    // Weighted
    const lt0 = d(data[i].bottom, 0);
    const lh0 = d(data[i].top, 0);
    const lt1 = d(data[i - 1].bottom, 0);
    const lu1 = d(data[i - 1].bottom, 1);
    const lh1 = d(data[i - 1].top, 0);
    const ld3 = mod10(lt0 * 2 + lh0 + lt1 + lu1 + lh1);

    const preds = [ld1, ld2, ld3];
    for (let f = 0; f < 3; f++) {
      bt[f].total++;
      if (actualUnit !== preds[f]) bt[f].pass++;
    }
  }

  const allText = bt.map((r) => r.dead).join(" ");
  return { results: bt, allText, lastUnit: units[n - 1] };
}

export default function Tool031UnitsDead() {
  return (
    <ToolShell title="ดับหลักหน่วยล่าง 3 สูตร" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                <div className="text-center text-sm text-ink/60">
                  หลักหน่วยงวดล่าสุด = <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white">{result.lastUnit}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {result.results.map((r, i) => (
                    <div key={i} className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-center shadow-sm">
                      <div className="text-[11px] font-bold uppercase text-ink/50">สูตร {i + 1}</div>
                      <div className="text-[10px] text-ink/40">{r.label}</div>
                      <div className="mt-2 text-5xl font-black text-emerald-600">{r.dead}</div>
                      <div className="mt-1 text-[10px] text-ink/50">{r.method}</div>
                      <div className="mt-2 text-xs font-bold text-green-600">
                        ผ่าน {r.pass}/{r.total} ({r.total > 0 ? ((r.pass / r.total) * 100).toFixed(0) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { copyText(result.allText); showToast("คัดลอก: " + result.allText); }}
                  className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white shadow transition hover:bg-emerald-600"
                >
                  📋 คัดลอกผลดับหลักหน่วย
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
