"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

function getDab(base: number): [string, string] {
  return [String(mod10(base + 8)), String(mod10(base + 9))];
}

type Row = {
  date: string; top: string; bot: string;
  tens: number; units: number; point: number; hundred: number;
  dab1: [string, string]; dab2: [string, string]; dab3: [string, string];
  res1?: string; res2?: string; res3?: string;
};

function compute(data: ParsedEntry[]) {
  if (data.length < 1) return null;
  const rows: Row[] = data.map((e) => {
    const tens = d(e.bottom, 0);
    const units = d(e.bottom, 1);
    const point = mod10(tens + units);
    const hundred = d(e.top, 0);
    return {
      date: e.date, top: e.top, bot: e.bottom,
      tens, units, point, hundred,
      dab1: getDab(point + 1),
      dab2: getDab(point + hundred),
      dab3: getDab(tens + units + point),
    };
  });

  // Check results against next draw
  for (let i = 0; i < rows.length - 1; i++) {
    const nextBot = rows[i + 1].bot;
    const check = (dab: [string, string]) => {
      const both = nextBot.includes(dab[0]) && nextBot.includes(dab[1]);
      return both ? "ผิด" : "ผ่าน";
    };
    rows[i].res1 = check(rows[i].dab1);
    rows[i].res2 = check(rows[i].dab2);
    rows[i].res3 = check(rows[i].dab3);
  }

  const last = rows[rows.length - 1];
  const pred1 = getDab(last.point + 1).join("");
  const pred2 = getDab(last.point + last.hundred).join("");
  const pred3 = getDab(last.tens + last.units + last.point).join("");

  return { rows, pred1, pred2, pred3, text: `${pred1} ${pred2} ${pred3}` };
}

export default function Tool006GreenThree() {
  return (
    <ToolShell title="สามเขียว" minEntries={1}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);

        const scored = result
          ? result.rows.filter((r) => r.res1 !== undefined)
          : [];
        const scoreData = [1, 2, 3].map((n) => {
          const key = `res${n}` as "res1" | "res2" | "res3";
          const pass = scored.filter((r) => r[key] === "ผ่าน").length;
          return { label: `สูตร ${n}`, pass, total: scored.length };
        });

        const ScorePanel = () => (
          <div className="grid grid-cols-3 gap-3">
            {scoreData.map((s) => (
              <div key={s.label} className="rounded-xl border border-ink/10 bg-white p-3 text-center shadow-sm">
                <div className="text-xs font-semibold text-ink/50 uppercase">{s.label}</div>
                <div className="mt-1 text-2xl font-black text-green-600">{s.pass}<span className="text-sm font-normal text-ink/40">/{s.total}</span></div>
                <div className="text-xs text-ink/50">
                  {s.total > 0 ? ((s.pass / s.total) * 100).toFixed(0) : 0}% ผ่าน
                </div>
              </div>
            ))}
          </div>
        );

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                {/* Score top */}
                <ScorePanel />

                {/* Predictions */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "สูตร 1", val: result.pred1 },
                    { label: "สูตร 2", val: result.pred2 },
                    { label: "สูตร 3", val: result.pred3 },
                  ].map((f) => (
                    <div key={f.label} className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center">
                      <div className="text-xs font-bold uppercase text-ink/50">{f.label}</div>
                      <div className="text-4xl font-black text-green-700">{f.val}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { copyText(result.text); showToast("คัดลอก: " + result.text); }}
                  className="w-full rounded-xl bg-green-500 py-3 font-bold text-white shadow transition hover:bg-green-600"
                >
                  📋 คัดลอกผลลัพธ์
                </button>

                {/* Table */}
                <div className="overflow-auto rounded-lg border border-ink/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-center font-bold">
                        <th className="p-2">วันที่</th>
                        <th className="p-2">บน</th>
                        <th className="p-2">ล่าง</th>
                        <th className="p-2">สิบ</th>
                        <th className="p-2">หน่วย</th>
                        <th className="p-2">แต้ม</th>
                        <th className="p-2">สูตร1</th>
                        <th className="p-2">สูตร2</th>
                        <th className="p-2">สูตร3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((r, i) => (
                        <tr key={i} className="border-b text-center hover:bg-gray-50">
                          <td className="p-2 text-ink/50">{r.date}</td>
                          <td className="p-2">{r.top}</td>
                          <td className="p-2 font-bold text-blue-600">{r.bot}</td>
                          <td className="p-2"><span className="rounded bg-blue-100 px-1">{r.tens}</span></td>
                          <td className="p-2"><span className="rounded bg-orange-100 px-1">{r.units}</span></td>
                          <td className="p-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white">{r.point}</span></td>
                          <td className={`p-2 font-bold ${r.res1 === "ผ่าน" ? "bg-green-50 text-green-600" : r.res1 === "ผิด" ? "bg-red-50 text-red-600" : ""}`}>
                            {r.dab1.join("")} {r.res1 && <small className="font-normal text-ink/40">{r.res1}</small>}
                          </td>
                          <td className={`p-2 font-bold ${r.res2 === "ผ่าน" ? "bg-green-50 text-green-600" : r.res2 === "ผิด" ? "bg-red-50 text-red-600" : ""}`}>
                            {r.dab2.join("")} {r.res2 && <small className="font-normal text-ink/40">{r.res2}</small>}
                          </td>
                          <td className={`p-2 font-bold ${r.res3 === "ผ่าน" ? "bg-green-50 text-green-600" : r.res3 === "ผิด" ? "bg-red-50 text-red-600" : ""}`}>
                            {r.dab3.join("")} {r.res3 && <small className="font-normal text-ink/40">{r.res3}</small>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Score bottom */}
                <ScorePanel />
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
