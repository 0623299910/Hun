"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

function calcV2(top: string, bot: string): string[] {
  const t0 = d(top, 0), t1 = d(top, 1), t2 = d(top, 2);
  const b0 = d(bot, 0), b1 = d(bot, 1);
  const sumTop = t0 + t1 + t2, sumBot = b0 + b1;
  return [
    `${mod10(t0 + b1 + 7)}${mod10(b0 + 3)}`,
    `${mod10(t1 * 2 + 1)}${mod10(t2 + b0 + 4)}`,
    `${mod10(sumTop + 9)}${mod10(sumBot + 2)}`,
    `${mod10(t2 + b1 + 5)}${mod10(t0 + b0 + 8)}`,
    `${mod10(t1 + b1 + 1)}${mod10(b0 * 3)}`,
  ];
}

export default function Tool012DirectCutV2() {
  return (
    <ToolShell title="ดับตรงๆ v2" minEntries={1}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const last = data.length > 0 ? data[data.length - 1] : null;
        const pairs = last ? calcV2(last.top, last.bottom) : null;

        // History
        const history = data.slice(0, -1).map((entry, i) => {
          const preds = calcV2(entry.top, entry.bottom);
          const nextBot = data[i + 1].bottom;
          const allMatch = preds.some((p) => p === nextBot);
          return { date: data[i + 1].date, bot: nextBot, preds, fail: allMatch };
        }).reverse();

        const passCount = history.filter((h) => !h.fail).length;
        const failCount = history.filter((h) => h.fail).length;
        const acc = history.length > 0 ? ((passCount / history.length) * 100).toFixed(0) : "0";

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {pairs && (
              <div className="space-y-4 animate-[fadeIn_0.5s]">
                {/* Result */}
                <div className="rounded-xl border-2 border-blue-100 bg-blue-50 p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-bold text-ink">ผลลัพธ์ล่าสุด (5 คู่)</h3>
                    <span className="text-xs text-ink/50">จากงวด: {last!.date}</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {pairs.map((p, i) => (
                      <span key={i} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-3xl font-black text-slate-700 shadow">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <button onClick={() => { const text = pairs.join("      "); copyText(text); showToast("คัดลอก 5 คู่"); }}
                  className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow transition hover:bg-blue-700">
                  📋 คัดลอก
                </button>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-white p-3 text-center shadow-sm">
                    <div className="text-xs text-ink/50">แม่นยำ</div>
                    <div className="text-2xl font-bold text-blue-600">{acc}%</div>
                  </div>
                  <div className="rounded-lg border bg-white p-3 text-center shadow-sm">
                    <div className="text-xs text-ink/50">ผ่าน</div>
                    <div className="text-2xl font-bold text-green-600">{passCount}</div>
                  </div>
                  <div className="rounded-lg border bg-white p-3 text-center shadow-sm">
                    <div className="text-xs text-ink/50">หลุด</div>
                    <div className="text-2xl font-bold text-red-600">{failCount}</div>
                  </div>
                </div>

                {/* History */}
                <div className="overflow-auto rounded-lg border border-ink/10" style={{ maxHeight: 400 }}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50"><tr className="border-b text-center font-bold">
                      <th className="p-2">งวด</th><th className="p-2">ผลออก</th><th className="p-2">เลขดับ 5 คู่</th><th className="p-2">สถานะ</th>
                    </tr></thead>
                    <tbody>{history.map((h, i) => (
                      <tr key={i} className="border-b text-center hover:bg-gray-50">
                        <td className="p-2">{h.date}</td>
                        <td className="p-2 font-bold">{h.bot}</td>
                        <td className="p-2">{h.preds.join("  ")}</td>
                        <td className={`p-2 font-bold ${h.fail ? "text-red-600" : "text-green-600"}`}>{h.fail ? "❌ หลุด" : "✅ ผ่าน"}</td>
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
