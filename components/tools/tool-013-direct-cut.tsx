"use client";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/* Same V.2 formula as tool-012 but Quick Mode UI (auto-copy on Enter) */
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

export default function Tool013DirectCut() {
  return (
    <ToolShell title="ดับตรงๆ (Quick Mode)" minEntries={1}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const last = data.length > 0 ? data[data.length - 1] : null;
        const pairs = last ? calcV2(last.top, last.bottom) : null;

        const handleEnterCopy = () => {
          if (pairs) {
            copyText(pairs.join("      ")).then(() => showToast("คัดลอกเรียบร้อย! พร้อมวาง GoodNotes"));
          }
        };

        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wide text-ink/60">วางข้อมูลที่นี่</label>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">กด Enter = คำนวณ+คัดลอก</span>
              </div>
              <textarea
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnterCopy(); }
                }}
                placeholder="วางข้อมูลจาก Excel แล้วกด Enter..."
                className="h-36 w-full rounded-xl border border-ink/15 bg-white p-3 font-mono text-xs leading-relaxed text-ink outline-none transition focus:border-pine/60 focus:ring-2 focus:ring-pine/20"
              />
            </div>

            <div className={`transition-all duration-300 ${pairs ? "opacity-100" : "opacity-50 blur-[1px]"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-ink">ผลลัพธ์ล่าสุด (5 คู่)</h3>
                <span className="text-xs text-ink/50 bg-ink/5 px-2 py-1 rounded">
                  {last ? `จากงวด: ${last.date}` : "รอข้อมูล..."}
                </span>
              </div>
              <div
                onClick={handleEnterCopy}
                className="cursor-pointer rounded-xl border-2 border-blue-100 bg-blue-50 p-6 text-center transition hover:bg-blue-100"
              >
                <div className="flex flex-wrap justify-center gap-4">
                  {(pairs ?? ["--", "--", "--", "--", "--"]).map((p, i) => (
                    <span key={i} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-3xl font-black text-slate-700 shadow">
                      {p}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-blue-400">คลิกเพื่อคัดลอก</p>
              </div>
            </div>
          </div>
        );
      }}
    </ToolShell>
  );
}
