"use client";
import { useMemo, useState } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

const formulaDescs = [
  "หน่วยบน + สิบล่าง",       // 1
  "ร้อย - สิบ + 3",          // 2
  "สิบ × 2 + หน่วย",         // 3
  "ร้อย + หน่วยล่าง",        // 4
  "สิบบน + สิบล่าง +2",      // 5
  "ร้อย×สิบ mod10",           // 6
  "หน่วยบน + ร้อย + 4",      // 7
  "สิบล่าง×2 + 1",            // 8
  "ร้อย - หน่วยล่าง + 5",    // 9
  "ผลรวม3ตัว + ผลรวม2ตัว",   // 10
];

function calcFormulaV9(id: number, entry: ParsedEntry, prev?: ParsedEntry): string {
  const t0 = d(entry.top, 0), t1 = d(entry.top, 1), t2 = d(entry.top, 2);
  const b0 = d(entry.bottom, 0), b1 = d(entry.bottom, 1);
  try {
    switch (id) {
      case 1: return `${mod10(t2 + b0)}${mod10(t1 + b1)}`;
      case 2: return `${mod10(t0 - t1 + 3)}${mod10(t1 - t2 + 3)}`;
      case 3: return `${mod10(t1 * 2 + t2)}${mod10(b0 * 2 + b1)}`;
      case 4: return `${mod10(t0 + b1)}${mod10(t2 + b0)}`;
      case 5: return `${mod10(t1 + b0 + 2)}${mod10(t2 + b1 + 2)}`;
      case 6: return `${mod10(t0 * t1)}${mod10(t1 * t2)}`;
      case 7: return `${mod10(t2 + t0 + 4)}${mod10(b0 + b1 + 4)}`;
      case 8: return `${mod10(b0 * 2 + 1)}${mod10(b1 * 2 + 1)}`;
      case 9: return `${mod10(t0 - b1 + 5)}${mod10(t2 - b0 + 5)}`;
      case 10: return `${mod10(t0 + t1 + t2)}${mod10(b0 + b1)}`;
      default: return "--";
    }
  } catch { return "--"; }
}

export default function Tool011DirectCutV9() {
  const [tab, setTab] = useState<"input" | "summary" | number>("input");

  return (
    <ToolShell title="ดับตรงๆ4 (V9)" minEntries={2}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const allNextPreds = data.length > 0 ? Array.from({ length: 10 }, (_, i) => ({
          id: i + 1, pred: calcFormulaV9(i + 1, data[data.length - 1]),
        })) : [];

        const allStats = allNextPreds.map(({ id, pred }) => {
          let pass = 0, fail = 0;
          const history: { date: string; bot: string; pred: string; ok: boolean }[] = [];
          for (let j = 0; j < data.length - 1; j++) {
            const p = calcFormulaV9(id, data[j]);
            const actual = data[j + 1].bottom;
            const ok = p !== actual;
            if (ok) pass++; else fail++;
            history.push({ date: data[j + 1].date, bot: actual, pred: p, ok });
          }
          return { id, pred, pass, fail, history: history.reverse(), acc: pass + fail > 0 ? ((pass / (pass + fail)) * 100).toFixed(0) : "0" };
        });

        const allText = allNextPreds.map((p) => p.pred).join("  ");

        return (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow">
              <button onClick={() => setTab("input")} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${tab === "input" ? "bg-red-800 text-white" : "text-ink/60"}`}>ข้อมูล</button>
              <button onClick={() => setTab("summary")} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${tab === "summary" ? "bg-red-800 text-white" : "text-ink/60"}`}>สรุปผล</button>
              {Array.from({ length: 10 }, (_, i) => (
                <button key={i} onClick={() => setTab(i + 1)} className={`rounded-lg px-2 py-2 text-xs font-bold transition ${tab === i + 1 ? "bg-red-800 text-white" : "text-ink/60"}`}>{i + 1}</button>
              ))}
            </div>

            {tab === "input" && <DataInput value={localInput} onChange={setLocalInput} />}

            {tab === "summary" && data.length > 0 && (
              <div className="space-y-4 animate-[fadeIn_0.3s]">
                {/* Horizontal results */}
                <div className="overflow-auto rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
                  <h2 className="mb-2 text-lg font-bold text-yellow-800">ผลลัพธ์แนวนอน</h2>
                  <div className="flex gap-3">
                    {allNextPreds.map((p) => (
                      <div key={p.id} className="rounded-lg border border-yellow-200 bg-white px-3 py-2 text-center">
                        <div className="text-[10px] text-ink/40">ส.{p.id}</div>
                        <div className="text-xl font-black text-red-600">{p.pred}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => { copyText(allText); showToast("คัดลอก 10 สูตร"); }}
                  className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow">📋 Copy (GoodNotes)</button>

                {/* Stats table */}
                <div className="overflow-hidden rounded-lg border border-ink/10">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b bg-gray-50 text-center font-bold">
                      <th className="p-2">สูตร</th><th className="p-2">เลขดับ</th><th className="p-2">ผ่าน</th><th className="p-2">หลุด</th><th className="p-2">แม่นยำ</th>
                    </tr></thead>
                    <tbody>{allStats.map((s) => (
                      <tr key={s.id} className="border-b text-center hover:bg-gray-50">
                        <td className="p-2 font-bold">ส.{s.id}</td>
                        <td className="p-2 text-lg font-bold text-red-600">{s.pred}</td>
                        <td className="p-2 text-green-600 font-bold">{s.pass}</td>
                        <td className="p-2 text-red-600 font-bold">{s.fail}</td>
                        <td className="p-2 font-bold">{s.acc}%</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {typeof tab === "number" && allStats[tab - 1] && (
              <div className="space-y-3 animate-[fadeIn_0.3s]">
                <div className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-4">
                  <div><h3 className="font-bold">สูตร {tab}: {formulaDescs[tab - 1]}</h3>
                    <div className="flex gap-2 text-xs">
                      <span className="rounded bg-green-100 px-2 font-bold text-green-700">ผ่าน {allStats[tab - 1].pass}</span>
                      <span className="rounded bg-red-100 px-2 font-bold text-red-700">หลุด {allStats[tab - 1].fail}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-red-600">{allStats[tab - 1].pred}</div>
                </div>
                <div className="overflow-hidden rounded-lg border border-ink/10">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b bg-gray-50 text-center font-bold">
                      <th className="p-2">งวด</th><th className="p-2">ที่มา</th><th className="p-2 bg-red-50 text-red-700">ดับ</th><th className="p-2">ออก</th><th className="p-2">ผล</th>
                    </tr></thead>
                    <tbody>{allStats[tab - 1].history.slice(0, 20).map((h, i) => (
                      <tr key={i} className="border-b text-center hover:bg-gray-50">
                        <td className="p-2">{h.date}</td><td className="p-2">-</td>
                        <td className="p-2 font-bold text-red-600">{h.pred}</td>
                        <td className="p-2 font-bold">{h.bot}</td>
                        <td className={`p-2 font-bold ${h.ok ? "text-green-600" : "text-red-600"}`}>{h.ok ? "✅" : "❌"}</td>
                      </tr>
                    ))}</tbody>
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
