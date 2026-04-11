"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

function compute(data: ParsedEntry[]) {
  if (data.length < 3) return null;
  const l1 = data[data.length - 1];
  const l2 = data[data.length - 2];
  const next1 = `${mod10(d(l2.top, 2) + d(l1.top, 2))}${mod10(d(l2.bottom, 0) + d(l1.bottom, 0))}`;
  const next2 = `${mod10(d(l2.bottom, 0) + d(l2.bottom, 1))}${mod10(d(l1.bottom, 0) + d(l1.bottom, 1))}`;
  const next3 = `${mod10(d(l2.top, 0) + d(l2.top, 1) + d(l2.top, 2))}${mod10(d(l1.top, 0) + d(l1.top, 1) + d(l1.top, 2))}`;

  // History
  const history: { date: string; bot: string; d1: string; d2: string; d3: string; pass1: boolean; pass2: boolean; pass3: boolean }[] = [];
  for (let i = 2; i < data.length; i++) {
    const p2 = data[i - 2], p1 = data[i - 1], curr = data[i];
    const dd1 = `${mod10(d(p2.top, 2) + d(p1.top, 2))}${mod10(d(p2.bottom, 0) + d(p1.bottom, 0))}`;
    const dd2 = `${mod10(d(p2.bottom, 0) + d(p2.bottom, 1))}${mod10(d(p1.bottom, 0) + d(p1.bottom, 1))}`;
    const dd3 = `${mod10(d(p2.top, 0) + d(p2.top, 1) + d(p2.top, 2))}${mod10(d(p1.top, 0) + d(p1.top, 1) + d(p1.top, 2))}`;
    history.unshift({
      date: curr.date, bot: curr.bottom,
      d1: dd1, d2: dd2, d3: dd3,
      pass1: dd1 !== curr.bottom, pass2: dd2 !== curr.bottom, pass3: dd3 !== curr.bottom,
    });
  }

  return { next1, next2, next3, history, text: `${next1} ${next2} ${next3}` };
}

export default function Tool005ThreePairFormulas() {
  return (
    <ToolShell title="คู่ดับตรงๆ 3 สูตร" minEntries={3}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                {/* Predictions */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "สูตร 1", val: result.next1, color: "indigo" },
                    { label: "สูตร 2", val: result.next2, color: "purple" },
                    { label: "สูตร 3", val: result.next3, color: "pink" },
                  ].map((f) => (
                    <div key={f.label} className={`rounded-xl border-2 border-${f.color}-200 bg-${f.color}-50 p-4 text-center`}>
                      <div className="text-xs font-bold uppercase text-ink/50">{f.label}</div>
                      <div className={`text-4xl font-black text-${f.color}-600`}>{f.val}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { copyText(result.text); showToast("คัดลอก: " + result.text); }}
                  className="w-full rounded-xl bg-green-500 py-3 font-bold text-white shadow transition hover:bg-green-600"
                >
                  📋 คัดลอกผลลัพธ์ ({result.text})
                </button>

                {/* History */}
                <div className="overflow-hidden rounded-lg border border-ink/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-center font-bold text-ink/60">
                        <th className="p-2">งวด</th>
                        <th className="p-2">ผลออก</th>
                        <th className="p-2">สูตร1</th>
                        <th className="p-2">สูตร2</th>
                        <th className="p-2">สูตร3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.history.map((r, i) => (
                        <tr key={i} className="border-b text-center hover:bg-gray-50">
                          <td className="p-2">{r.date}</td>
                          <td className="p-2 font-bold">{r.bot}</td>
                          <td className={`p-2 font-bold ${r.pass1 ? "text-green-600" : "text-red-600"}`}>
                            {r.d1} {r.pass1 ? "" : "❌"}
                          </td>
                          <td className={`p-2 font-bold ${r.pass2 ? "text-green-600" : "text-red-600"}`}>
                            {r.d2} {r.pass2 ? "" : "❌"}
                          </td>
                          <td className={`p-2 font-bold ${r.pass3 ? "text-green-600" : "text-red-600"}`}>
                            {r.d3} {r.pass3 ? "" : "❌"}
                          </td>
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
