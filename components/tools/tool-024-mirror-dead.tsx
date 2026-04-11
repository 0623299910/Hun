"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/*
  สูตร "คู่ดับกระจก"
  แนวคิด: สร้าง "ภาพกระจก" ของเลขจากหลายมุม แล้วคำนวณคู่ที่ไม่ควรมา
    1) กระจกตรง: (9-สิบ)(9-หน่วย) ของงวดล่าสุด
    2) กระจกไขว้: (9-หน่วย)(9-สิบ) ของงวดล่าสุด
    3) กระจกย้อน 2 งวด: เฉลี่ย mirror ของ 2 งวดล่าสุด
    4) กระจกบน-ล่าง: mirror หลักร้อยจับคู่ mirror แต้ม
    5) กระจกผลรวม: mirror ของ (สิบ+หน่วย) จับคู่ mirror ของ (ร้อย+สิบบน)
    6) กระจกสลับชั้น: สิบของ(n-1) กระจก + หน่วยของ(n-2) กระจก
*/

type Row = { label: string; pair: string; method: string };

function compute(data: ParsedEntry[]) {
  if (data.length < 3) return null;
  const n = data.length;
  const last = data[n - 1];
  const prev = data[n - 2];
  const prev2 = data[n - 3];

  const mirr = (x: number) => mod10(9 - x);

  const t0 = d(last.bottom, 0);
  const u0 = d(last.bottom, 1);
  const t1 = d(prev.bottom, 0);
  const u1 = d(prev.bottom, 1);
  const t2 = d(prev2.bottom, 0);
  const u2 = d(prev2.bottom, 1);
  const h0 = d(last.top, 0);
  const h1 = d(last.top, 1);
  const point0 = mod10(t0 + u0);

  const results: Row[] = [
    {
      label: "กระจกตรง",
      pair: `${mirr(t0)}${mirr(u0)}`,
      method: `(9-${t0})(9-${u0})`,
    },
    {
      label: "กระจกไขว้",
      pair: `${mirr(u0)}${mirr(t0)}`,
      method: `(9-${u0})(9-${t0}) สลับตำแหน่ง`,
    },
    {
      label: "กระจกเฉลี่ย 2 งวด",
      pair: `${mirr(mod10(Math.round((t0 + t1) / 2)))}${mirr(mod10(Math.round((u0 + u1) / 2)))}`,
      method: `mirror(avg สิบ 2 งวด), mirror(avg หน่วย 2 งวด)`,
    },
    {
      label: "กระจกบน-ล่าง",
      pair: `${mirr(h0)}${mirr(point0)}`,
      method: `mirror(หลักร้อย ${h0}) + mirror(แต้ม ${point0})`,
    },
    {
      label: "กระจกผลรวม",
      pair: `${mirr(mod10(t0 + u0))}${mirr(mod10(h0 + h1))}`,
      method: `mirror(สิบ+หน่วย) + mirror(ร้อย+สิบบน)`,
    },
    {
      label: "กระจกสลับชั้น",
      pair: `${mirr(t1)}${mirr(u2)}`,
      method: `mirror(สิบ n-1: ${t1}) + mirror(หน่วย n-2: ${u2})`,
    },
  ];

  // Backtest: for each formula, re-compute from historical data and check
  const backtestResults = results.map((r) => {
    let pass = 0;
    let total = 0;
    return { ...r, pass, total };
  });

  for (let i = 2; i < n - 1; i++) {
    const cLast = data[i];
    const cPrev = data[i - 1];
    const cPrev2 = data[i - 2];

    const ct0 = d(cLast.bottom, 0);
    const cu0 = d(cLast.bottom, 1);
    const ct1 = d(cPrev.bottom, 0);
    const cu1 = d(cPrev.bottom, 1);
    const cu2 = d(cPrev2.bottom, 1);
    const ct2 = d(cPrev2.bottom, 0);
    const ch0 = d(cLast.top, 0);
    const ch1 = d(cLast.top, 1);
    const cp0 = mod10(ct0 + cu0);

    const formPairs = [
      `${mirr(ct0)}${mirr(cu0)}`,
      `${mirr(cu0)}${mirr(ct0)}`,
      `${mirr(mod10(Math.round((ct0 + ct1) / 2)))}${mirr(mod10(Math.round((cu0 + cu1) / 2)))}`,
      `${mirr(ch0)}${mirr(cp0)}`,
      `${mirr(mod10(ct0 + cu0))}${mirr(mod10(ch0 + ch1))}`,
      `${mirr(ct1)}${mirr(cu2)}`,
    ];

    const actual = data[i + 1].bottom;
    for (let f = 0; f < 6; f++) {
      backtestResults[f].total++;
      if (actual !== formPairs[f]) backtestResults[f].pass++;
    }
  }

  const allText = backtestResults.map((r) => r.pair).join(" ");
  return { results: backtestResults, allText };
}

export default function Tool024MirrorDead() {
  return (
    <ToolShell title="คู่ดับกระจก" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {result.results.map((r, i) => (
                    <div key={i} className="rounded-xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-white p-4 text-center shadow-sm">
                      <div className="text-[11px] font-bold uppercase text-ink/50">{r.label}</div>
                      <div className="mt-1 text-4xl font-black text-pink-700">{r.pair}</div>
                      <div className="mt-1 text-[10px] text-ink/50">{r.method}</div>
                      <div className="mt-2 text-xs font-bold text-green-600">
                        ผ่าน {r.pass}/{r.total} ({r.total > 0 ? ((r.pass / r.total) * 100).toFixed(0) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { copyText(result.allText); showToast("คัดลอก: " + result.allText); }}
                  className="w-full rounded-xl bg-pink-500 py-3 font-bold text-white shadow transition hover:bg-pink-600"
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
