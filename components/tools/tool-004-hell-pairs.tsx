"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, copyText } from "@/lib/data-parser";

function compute(data: ParsedEntry[]) {
  if (data.length < 2) return null;
  const prev1 = data[data.length - 2];
  const prev2 = data[data.length - 1];
  const f1 = {
    main: prev1.top.charAt(1) + prev2.top.charAt(1),
    rev: prev2.top.charAt(1) + prev1.top.charAt(1),
  };
  const h1 = parseInt(prev1.top.charAt(0));
  const sum2 = (parseInt(prev2.top.charAt(1)) + parseInt(prev2.top.charAt(2))) % 10;
  const f2 = {
    main: h1.toString() + sum2.toString(),
    rev: sum2.toString() + h1.toString(),
  };
  return { f1, f2, text: `${f1.main} ${f1.rev} ${f2.main} ${f2.rev}` };
}

export default function Tool004HellPairs() {
  return (
    <ToolShell title="คู่ดับนรกแตก" minEntries={2}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {result && (
              <div className="animate-[fadeIn_0.5s] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Formula 1 */}
                  <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 text-center shadow-lg">
                    <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-purple-500">
                      สูตร 1
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-4xl font-black text-purple-700">
                        {result.f1.main}
                      </span>
                      <span className="text-4xl font-black text-purple-400">
                        {result.f1.rev}
                      </span>
                    </div>
                  </div>
                  {/* Formula 2 */}
                  <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 text-center shadow-lg">
                    <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-orange-500">
                      สูตร 2
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-4xl font-black text-orange-700">
                        {result.f2.main}
                      </span>
                      <span className="text-4xl font-black text-orange-400">
                        {result.f2.rev}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    copyText(result.text);
                    showToast("คัดลอก: " + result.text);
                  }}
                  className="w-full rounded-xl bg-blue-500 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-blue-600 active:scale-[0.98]"
                >
                  📋 คัดลอกผลลัพธ์
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
