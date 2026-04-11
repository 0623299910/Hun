"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

function calcF1(lastDigit: number) { const n: number[] = []; for (let i = 0; i < 8; i++) n.push((lastDigit + i) % 10); return n; }
function calcF2(bot: string) { const start = (d(bot, 0) + d(bot, 1) + 1) % 10; const n: number[] = []; for (let i = 0; i < 8; i++) n.push((start + i) % 10); return n; }
function calcF3(h: number, lastD: number, tens: number, botTens: number) {
  const dead1 = (h + lastD) % 10, dead2 = (tens + botTens) % 10;
  return [0,1,2,3,4,5,6,7,8,9].filter((n) => n !== dead1 && n !== dead2).slice(0, 8);
}

function compute(data: ParsedEntry[]) {
  if (data.length < 1) return null;
  const last = data[data.length - 1];
  const lastDigit = d(last.top, 2);
  const h = d(last.top, 0);
  const tens = d(last.top, 1);
  const botTens = d(last.bottom, 0);

  const f1Full = calcF1(lastDigit);
  const f2Full = calcF2(last.bottom);
  const f3Full = calcF3(h, lastDigit, tens, botTens);

  const all = [0,1,2,3,4,5,6,7,8,9];
  const f1Dead = all.filter((n) => !f1Full.includes(n));
  const f2Dead = all.filter((n) => !f2Full.includes(n));
  const f3Dead = all.filter((n) => !f3Full.includes(n));

  // History for last 10
  const history = data.slice(-11).map((entry, i, arr) => {
    if (i === arr.length - 1) return null;
    const next = arr[i + 1];
    const ld = d(entry.top, 2);
    const ff1 = all.filter((n) => !calcF1(ld).includes(n));
    const ff2 = all.filter((n) => !calcF2(entry.bottom).includes(n));
    const ff3 = all.filter((n) => !calcF3(d(entry.top, 0), ld, d(entry.top, 1), d(entry.bottom, 0)).includes(n));
    const checkNums = [d(next.bottom, 0), d(next.bottom, 1)];
    return { date: entry.date, top: entry.top, bot: entry.bottom, nextBot: next.bottom, f1: ff1, f2: ff2, f3: ff3, checkNums };
  }).filter(Boolean) as any[];

  return { f1Dead, f2Dead, f3Dead, history, text: `${f1Dead.join(" ")}  ||  ${f2Dead.join(" ")}  ||  ${f3Dead.join(" ")}` };
}

export default function Tool009ThreeDeadPairs() {
  return (
    <ToolShell title="ดับสามคู่" minEntries={1}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result && (
              <div className="space-y-4 animate-[fadeIn_0.5s]">
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { label: "สูตร 1: เดินหน้าหน่วย", nums: result.f1Dead, border: "purple" },
                    { label: "สูตร 2: ผลรวมล่าง+1", nums: result.f2Dead, border: "pink" },
                    { label: "สูตร 3: ไขว้เลขตับ", nums: result.f3Dead, border: "yellow" },
                  ].map((f) => (
                    <div key={f.label} className={`rounded-xl border-l-4 border-${f.border}-500 bg-white p-4 shadow`}>
                      <h3 className="mb-2 text-xs font-bold uppercase text-ink/50">{f.label}</h3>
                      <div className="text-3xl font-mono font-bold tracking-widest text-ink">{f.nums.join("  ")}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { copyText(result.text); showToast("คัดลอกผลลัพธ์"); }}
                  className="w-full rounded-xl bg-green-600 py-3 font-bold text-white shadow transition hover:bg-green-700">
                  📋 คัดลอกผลลัพธ์
                </button>
                {/* History */}
                <div className="overflow-auto rounded-lg border border-ink/10">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b bg-gray-50 text-center font-bold">
                      <th className="p-2">วันที่</th><th className="p-2">บน/ล่าง</th><th className="p-2">ส1</th><th className="p-2">ส2</th><th className="p-2">ส3</th>
                    </tr></thead>
                    <tbody>
                      {result.history.reverse().slice(0, 10).map((h: any, i: number) => (
                        <tr key={i} className="border-b text-center hover:bg-gray-50">
                          <td className="p-2 text-blue-500 font-bold">{h.date}</td>
                          <td className="p-2"><span className="text-yellow-600">{h.top}</span> / <span className="rounded bg-blue-600 px-1 text-white font-bold">{h.bot}</span></td>
                          <td className="p-2">{h.f1.map((n: number) => h.checkNums.includes(n) ? `<${n}>` : String(n)).join(" ")}</td>
                          <td className="p-2">{h.f2.map((n: number) => h.checkNums.includes(n) ? `<${n}>` : String(n)).join(" ")}</td>
                          <td className="p-2">{h.f3.map((n: number) => h.checkNums.includes(n) ? `<${n}>` : String(n)).join(" ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
