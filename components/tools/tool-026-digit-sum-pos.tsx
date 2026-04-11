"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  สูตร "คู่ดับผลรวมตำแหน่ง"
  แนวคิด: รวมเลขจาก "ตำแหน่ง" ต่างๆ ข้ามหลายงวด ด้วยเทคนิค carry-drop (ตัดหลักสิบทิ้ง)
    1) สิบ(n) + หน่วย(n-1) | หน่วย(n) + สิบ(n-1)  → "ไขว้รวม 2 งวด"
    2) ร้อย(n) + สิบล่าง(n) + หน่วยล่าง(n-1) | ร้อย(n-1) + หน่วยล่าง(n) + สิบล่าง(n-1)  → "สามชั้นข้าม"
    3) (สิบ+หน่วย)(n) + (สิบ+หน่วย)(n-1) mod10 → ทั้งคู่ | สลับตำแหน่ง  → "ผลรวมคู่ซ้อน"
    4) สิบ(n)×2 + หน่วย(n-2) | หน่วย(n)×2 + สิบ(n-2)  → "ถ่วงน้ำหนัก×2"
    5) |สิบ(n)-หน่วย(n)| concat |สิบ(n-1)-หน่วย(n-1)| → "ผลต่างสะสม"
    6) (ร้อย+สิบ+หน่วย ของบน)(n) mod10 | (สิบ+หน่วย ของล่าง ×2)(n) mod10 → "บน-ล่าง ถ่วง"
*/

function compute(data: ParsedEntry[]) {
  if (data.length < 3) return null;
  const n = data.length;
  const last = data[n - 1];
  const prev = data[n - 2];
  const prev2 = n >= 3 ? data[n - 3] : prev;

  const t = (e: ParsedEntry) => d(e.bottom, 0);
  const u = (e: ParsedEntry) => d(e.bottom, 1);
  const h = (e: ParsedEntry) => d(e.top, 0);
  const m = (e: ParsedEntry) => d(e.top, 1);
  const lo = (e: ParsedEntry) => d(e.top, 2);

  const formulas = [
    {
      label: "ไขว้รวม 2 งวด",
      pair: `${mod10(t(last) + u(prev))}${mod10(u(last) + t(prev))}`,
      method: `(${t(last)}+${u(prev)}) | (${u(last)}+${t(prev)})`,
    },
    {
      label: "สามชั้นข้าม",
      pair: `${mod10(h(last) + t(last) + u(prev))}${mod10(h(prev) + u(last) + t(prev))}`,
      method: `(ร้อย+สิบ+หน่วยก่อน) | (ร้อยก่อน+หน่วย+สิบก่อน)`,
    },
    {
      label: "ผลรวมคู่ซ้อน",
      pair: `${mod10(t(last) + u(last) + t(prev) + u(prev))}${mod10(t(last) + u(last) - t(prev) - u(prev) + 20)}`,
      method: `รวม4ตัว | ผลต่างรวม`,
    },
    {
      label: "ถ่วงน้ำหนัก ×2",
      pair: `${mod10(t(last) * 2 + u(prev2))}${mod10(u(last) * 2 + t(prev2))}`,
      method: `สิบ×2+หน่วย(n-2) | หน่วย×2+สิบ(n-2)`,
    },
    {
      label: "ผลต่างสะสม",
      pair: `${mod10(Math.abs(t(last) - u(last)))}${mod10(Math.abs(t(prev) - u(prev)))}`,
      method: `|${t(last)}-${u(last)}| concat |${t(prev)}-${u(prev)}|`,
    },
    {
      label: "บน-ล่าง ถ่วง",
      pair: `${mod10(h(last) + m(last) + lo(last))}${mod10((t(last) + u(last)) * 2)}`,
      method: `sumTop mod10 | sumBot×2 mod10`,
    },
  ];

  // Backtest
  const bt = formulas.map((f) => ({ ...f, pass: 0, total: 0 }));
  for (let i = 2; i < n - 1; i++) {
    const cl = data[i];
    const cp = data[i - 1];
    const cp2 = i >= 2 ? data[i - 2] : cp;
    const actual = data[i + 1].bottom;

    const preds = [
      `${mod10(t(cl) + u(cp))}${mod10(u(cl) + t(cp))}`,
      `${mod10(h(cl) + t(cl) + u(cp))}${mod10(h(cp) + u(cl) + t(cp))}`,
      `${mod10(t(cl) + u(cl) + t(cp) + u(cp))}${mod10(t(cl) + u(cl) - t(cp) - u(cp) + 20)}`,
      `${mod10(t(cl) * 2 + u(cp2))}${mod10(u(cl) * 2 + t(cp2))}`,
      `${mod10(Math.abs(t(cl) - u(cl)))}${mod10(Math.abs(t(cp) - u(cp)))}`,
      `${mod10(h(cl) + m(cl) + lo(cl))}${mod10((t(cl) + u(cl)) * 2)}`,
    ];

    for (let f = 0; f < 6; f++) {
      bt[f].total++;
      if (actual !== preds[f]) bt[f].pass++;
    }
  }

  const allText = bt.map((r) => r.pair).join(" ");
  return { results: bt, allText };
}

export default function Tool026DigitSumPos() {
  return (
    <ToolShell title="คู่ดับผลรวมตำแหน่ง" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {result.results.map((r, i) => (
                    <div key={i} className="rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 text-center shadow-sm">
                      <div className="text-[11px] font-bold uppercase text-ink/50">{r.label}</div>
                      <div className="mt-1 text-4xl font-black text-teal-700">{r.pair}</div>
                      <div className="mt-1 text-[10px] text-ink/50">{r.method}</div>
                      <div className="mt-2 text-xs font-bold text-green-600">
                        ผ่าน {r.pass}/{r.total} ({r.total > 0 ? ((r.pass / r.total) * 100).toFixed(0) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { copyText(result.allText); showToast("คัดลอก: " + result.allText); }}
                  className="w-full rounded-xl bg-teal-500 py-3 font-bold text-white shadow transition hover:bg-teal-600"
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
