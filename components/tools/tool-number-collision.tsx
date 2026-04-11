"use client";
import { useState, useCallback } from "react";

export default function ToolNumberCollision() {
  const [set1, setSet1] = useState("");
  const [set2, setSet2] = useState("");
  const [result, setResult] = useState<{ arr1: string[]; arr2: string[]; matches: string[] } | null>(null);

  const compare = useCallback(() => {
    const v1 = set1.replace(/[^0-9]/g, "");
    const v2 = set2.replace(/[^0-9]/g, "");
    if (!v1 || !v2) return;

    const arr1 = v1.split("");
    const arr2 = v2.split("");
    const unique1 = [...new Set(arr1)];
    const unique2 = [...new Set(arr2)];
    const matches = unique1.filter((x) => unique2.includes(x)).sort();

    setResult({ arr1, arr2, matches });
  }, [set1, set2]);

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") compare();
  };

  const clearData = () => {
    setSet1(""); setSet2(""); setResult(null);
  };

  const Ball = ({ num, isMatch }: { num: string; isMatch: boolean }) => (
    <div className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold transition ${
      isMatch
        ? "scale-110 bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/30 border-2 border-white"
        : "scale-90 bg-gray-100 text-gray-400 border border-gray-200"
    }`}>
      {num}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border-t-4 border-yellow-400 bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-center text-xl font-bold text-amber-900">⚡ เทียบชนเลขเด่น ⚡</h2>
        <p className="mb-6 text-center text-sm text-amber-700/60">พิมพ์เลขแล้วกด Enter เพื่อคำนวณทันที</p>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">📌 ชุดตัวเลขที่ 1</label>
            <input
              type="text"
              value={set1}
              onChange={(e) => setSet1(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="0123..."
              maxLength={15}
              className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-center text-2xl tracking-[5px] font-mono transition focus:border-yellow-400 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">📌 ชุดตัวเลขที่ 2</label>
            <input
              type="text"
              value={set2}
              onChange={(e) => setSet2(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="4567..."
              maxLength={15}
              className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-center text-2xl tracking-[5px] font-mono transition focus:border-yellow-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <button onClick={compare} className="flex-1 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 py-4 text-lg font-bold text-white transition hover:shadow-lg active:scale-[0.98]">
            🔍 เปรียบเทียบ (Enter)
          </button>
          <button onClick={clearData} className="rounded-xl bg-gray-200 px-6 py-4 font-bold text-gray-600 transition hover:bg-gray-300">
            🧹 เคลียร์
          </button>
        </div>

        {result && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="mb-2 text-xs font-bold uppercase text-gray-400">การวิเคราะห์ชุดที่ 1</div>
              <div className="flex flex-wrap justify-center gap-2">
                {result.arr1.map((num, i) => <Ball key={i} num={num} isMatch={result.matches.includes(num)} />)}
              </div>
            </div>

            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="mb-2 text-xs font-bold uppercase text-gray-400">การวิเคราะห์ชุดที่ 2</div>
              <div className="flex flex-wrap justify-center gap-2">
                {result.arr2.map((num, i) => <Ball key={i} num={num} isMatch={result.matches.includes(num)} />)}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-yellow-400 bg-yellow-50 p-5 text-center">
              <div className="text-lg font-bold text-orange-600">
                🔥 ชนกันทั้งหมด <span className="text-2xl">{result.matches.length}</span> ตัว 🔥
              </div>
              <div className="mt-2 text-4xl font-black tracking-[8px] text-amber-900">
                {result.matches.length > 0 ? result.matches.join(" ") : "ไม่ชน"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
