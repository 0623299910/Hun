"use client";
import { useState, useEffect, useCallback } from "react";
import { copyText } from "@/lib/data-parser";

const ODDS = [1, 3, 5, 7, 9];
const EVENS = [0, 2, 4, 6, 8];

export default function Tool022LuckMeter() {
  const [tab, setTab] = useState<"grid" | "single">("grid");
  const [gridNumbers, setGridNumbers] = useState<{ row1: number[]; row2: number[] }>({ row1: [], row2: [] });
  const [singleNumbers, setSingleNumbers] = useState<{ top: number | null; bottom: number | null }>({ top: null, bottom: null });
  const [singleMode, setSingleMode] = useState<"odd-even" | "odd-odd" | "even-even">("odd-even");
  const [autoCopy, setAutoCopy] = useState(false);
  const [toast, setToast] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const generateGrid = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      const r1 = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10));
      const r2 = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10));
      setGridNumbers({ row1: r1, row2: r2 });
      setIsAnimating(false);
      if (autoCopy) {
        copyText(`${r1.join("     ")}\n${r2.join("     ")}`).then(() => showToast("คัดลอกเรียบร้อย!"));
      }
    }, 150);
  }, [autoCopy]);

  const generateSingle = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      let topPool = ODDS, bottomPool = EVENS;
      if (singleMode === "odd-odd") { topPool = ODDS; bottomPool = ODDS; }
      else if (singleMode === "even-even") { topPool = EVENS; bottomPool = EVENS; }
      const top = topPool[Math.floor(Math.random() * topPool.length)];
      const bottom = bottomPool[Math.floor(Math.random() * bottomPool.length)];
      setSingleNumbers({ top, bottom });
      setIsAnimating(false);
      if (autoCopy) copyText(`${top}     ${bottom}`).then(() => showToast("คัดลอกเรียบร้อย!"));
    }, 150);
  }, [singleMode, autoCopy]);

  const handleGenerate = () => (tab === "grid" ? generateGrid() : generateSingle());

  useEffect(() => { generateGrid(); }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-900/50">
          <button onClick={() => setTab("grid")} className={`flex-1 py-4 text-base font-bold transition ${tab === "grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
            ชุด 5 ตัว
          </button>
          <button onClick={() => setTab("single")} className={`flex-1 py-4 text-base font-bold transition ${tab === "single" ? "bg-pink-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
            วัดดวง 1 ตัว
          </button>
        </div>

        {/* Auto copy toggle */}
        <div className="flex items-center justify-end border-b border-slate-700/50 bg-slate-900/30 px-4 py-2">
          <label className="flex cursor-pointer items-center gap-2">
            <span className={`text-xs font-semibold ${autoCopy ? "text-emerald-400" : "text-slate-500"}`}>{autoCopy ? "Auto Copy: ON" : "Auto Copy: OFF"}</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={autoCopy} onChange={() => setAutoCopy(!autoCopy)} />
              <div className={`block h-6 w-10 rounded-full transition ${autoCopy ? "bg-emerald-500" : "bg-slate-600"}`} />
              <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${autoCopy ? "translate-x-4" : ""}`} />
            </div>
          </label>
        </div>

        <div className="p-4 sm:p-6">
          {/* Grid tab */}
          {tab === "grid" && (
            <div>
              <h2 className="mb-2 text-center text-xl font-bold text-indigo-300">สุ่มเลข 0-9 (5 หลัก)</h2>
              <p className="mb-6 text-center text-xs text-slate-500">{autoCopy ? "🟢 พร้อมคัดลอกลง GoodNotes" : "แตะปุ่มเพื่อสุ่ม"}</p>
              <div className="mb-4 grid grid-cols-5 gap-2 sm:gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex aspect-[3/4] items-center justify-center rounded-xl border-b-4 border-slate-900 bg-slate-700 shadow-inner">
                      <span className={`text-3xl font-black text-cyan-400 sm:text-4xl ${isAnimating ? "opacity-0" : "animate-[popIn_0.3s_ease_forwards]"}`} style={{ animationDelay: `${i * 50}ms` }}>
                        {gridNumbers.row1[i] ?? "?"}
                      </span>
                    </div>
                    <div className="mx-auto h-0.5 w-1/2 rounded-full bg-slate-700 opacity-30" />
                    <div className="flex aspect-[3/4] items-center justify-center rounded-xl border-b-4 border-slate-900 bg-slate-700 shadow-inner">
                      <span className={`text-3xl font-black text-pink-400 sm:text-4xl ${isAnimating ? "opacity-0" : "animate-[popIn_0.3s_ease_forwards]"}`} style={{ animationDelay: `${i * 50 + 100}ms` }}>
                        {gridNumbers.row2[i] ?? "?"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single tab */}
          {tab === "single" && (
            <div>
              <h2 className="mb-4 text-center text-xl font-bold text-pink-300">วัดดวง 1 ตัว</h2>
              <div className="mb-4 flex justify-center gap-2">
                {([["odd-even", "คี่/คู่"], ["odd-odd", "คี่/คี่"], ["even-even", "คู่/คู่"]] as const).map(([mode, label]) => (
                  <button key={mode} onClick={() => setSingleMode(mode)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition ${singleMode === mode ? "bg-pink-600 text-white" : "bg-slate-700 text-slate-400"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-700">
                  <span className={`text-6xl font-black text-amber-400 ${isAnimating ? "opacity-0" : ""}`}>{singleNumbers.top ?? "?"}</span>
                </div>
                <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-700">
                  <span className={`text-6xl font-black text-emerald-400 ${isAnimating ? "opacity-0" : ""}`}>{singleNumbers.bottom ?? "?"}</span>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleGenerate}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-lg font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]">
            🎰 {tab === "grid" ? "สุ่มตัวเลข" : "วัดดวง"}
          </button>
        </div>
      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-bold text-white shadow-2xl transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}>
        ✅ {toast}
      </div>
    </div>
  );
}
