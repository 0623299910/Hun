"use client";
import { useState, useCallback } from "react";

export default function Tool017RandomOne() {
  const [set1, setSet1] = useState<string>("?");
  const [set2, setSet2] = useState<string>("?");
  const [spinning, setSpinning] = useState(false);

  const randomize = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setTimeout(() => {
      setSet1(Math.floor(Math.random() * 10).toString());
      setSet2(Math.floor(Math.random() * 10).toString());
      setSpinning(false);
    }, 300);
  }, [spinning]);

  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
        <h1 className="mb-8 text-center text-2xl font-bold text-white">🎲 เครื่องสุ่มตัวเลข</h1>

        <div className="mb-8 grid grid-cols-2 gap-6">
          <div className="rounded-xl bg-slate-700 p-6 text-center">
            <h2 className="mb-4 text-sm font-semibold text-slate-300">ชุดที่ 1</h2>
            <div className={`rounded-lg bg-slate-900 p-6 text-6xl font-black text-yellow-400 transition-transform ${spinning ? "animate-pulse" : ""}`}>
              {set1}
            </div>
            <p className="mt-2 text-xs text-slate-500">สุ่มเลข 0-9</p>
          </div>
          <div className="rounded-xl bg-slate-700 p-6 text-center">
            <h2 className="mb-4 text-sm font-semibold text-slate-300">ชุดที่ 2</h2>
            <div className={`rounded-lg bg-slate-900 p-6 text-6xl font-black text-yellow-400 transition-transform ${spinning ? "animate-pulse" : ""}`}>
              {set2}
            </div>
            <p className="mt-2 text-xs text-slate-500">สุ่มเลข 0-9</p>
          </div>
        </div>

        <button
          onClick={randomize}
          className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl active:scale-[0.98]"
        >
          🎰 สุ่มตัวเลข
        </button>
      </div>
    </div>
  );
}
