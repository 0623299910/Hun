"use client";
import { useState, useCallback } from "react";

const PAKLAK_LABELS = [
  ...Array.from({ length: 10 }, (_, i) => ({ value: `s${i}`, label: `s${i}`, color: "from-pink-100 to-pink-200" })),
  ...Array.from({ length: 10 }, (_, i) => ({ value: `n${i}`, label: `n${i}`, color: "from-blue-100 to-blue-200" })),
];

export default function Tool018RandomTwo() {
  const [tab, setTab] = useState<"random" | "paklak">("random");
  const [r1, setR1] = useState("?");
  const [r2, setR2] = useState("?");
  const [r3, setR3] = useState("??");
  const [paklakResult, setPaklakResult] = useState("?");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [spinning, setSpinning] = useState(false);

  const randomize = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setTimeout(() => {
      setR1(Math.floor(Math.random() * 10).toString());
      setR2(Math.floor(Math.random() * 10).toString());
      setR3(Math.floor(Math.random() * 100).toString().padStart(2, "0"));
      setSpinning(false);
    }, 300);
  }, [spinning]);

  const randomPaklak = useCallback(() => {
    if (selected.size === 0) return;
    const arr = Array.from(selected);
    setPaklakResult(arr[Math.floor(Math.random() * arr.length)]);
  }, [selected]);

  const togglePaklak = (val: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  };

  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="w-full max-w-4xl rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 p-8 shadow-2xl">
        {/* Tabs */}
        <div className="mb-8 flex justify-center gap-4">
          <button onClick={() => setTab("random")} className={`rounded-full px-8 py-3 font-bold transition ${tab === "random" ? "bg-white text-purple-600 shadow-lg" : "bg-purple-400/50 text-white"}`}>
            สุ่มตัวเลข
          </button>
          <button onClick={() => setTab("paklak")} className={`rounded-full px-8 py-3 font-bold transition ${tab === "paklak" ? "bg-white text-purple-600 shadow-lg" : "bg-purple-400/50 text-white"}`}>
            สุ่มปักหลัก
          </button>
        </div>

        <h1 className="mb-8 text-center text-2xl font-bold text-white">เครื่องสุ่มตัวเลข</h1>

        {tab === "random" && (
          <>
            <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { label: "ชุดที่ 1", val: r1, desc: "สุ่มเลข 0-9", bg: "from-pink-100 to-pink-200" },
                { label: "ชุดที่ 2", val: r2, desc: "สุ่มเลข 0-9", bg: "from-blue-100 to-blue-200" },
                { label: "ชุดที่ 3", val: r3, desc: "สุ่มเลข 00-99", bg: "from-green-100 to-green-200" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white p-6 shadow-lg">
                  <label className="mb-4 block text-center font-semibold text-gray-700">{item.label}</label>
                  <div className={`flex min-h-[128px] items-center justify-center rounded-xl bg-gradient-to-br ${item.bg} p-8`}>
                    <span className={`text-6xl font-black text-gray-700 ${spinning ? "animate-pulse" : ""}`}>{item.val}</span>
                  </div>
                  <p className="mt-3 text-center text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button onClick={randomize} className="rounded-full bg-white px-12 py-4 text-lg font-bold text-purple-600 shadow-lg transition hover:scale-105 hover:shadow-xl active:scale-95">
                🎰 สุ่มตัวเลข (Enter)
              </button>
            </div>
          </>
        )}

        {tab === "paklak" && (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-700">ตัวเลือกสุ่มปักหลัก</h2>
            <div className="mb-8 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {PAKLAK_LABELS.map((pl) => (
                <label
                  key={pl.value}
                  className={`cursor-pointer rounded-lg p-4 text-center font-bold transition ${
                    selected.has(pl.value) ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" : `bg-gradient-to-br ${pl.color} text-gray-700 hover:shadow-md`
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={selected.has(pl.value)} onChange={() => togglePaklak(pl.value)} />
                  {pl.label}
                </label>
              ))}
            </div>
            <div className="mb-6 flex min-h-[128px] items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-green-200 p-8">
              <span className="text-6xl font-black text-gray-700">{paklakResult}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => setSelected(new Set(PAKLAK_LABELS.map((p) => p.value)))} className="rounded-full bg-purple-500 px-8 py-3 font-bold text-white transition hover:bg-purple-600">
                เลือกทั้งหมด
              </button>
              <button onClick={() => setSelected(new Set())} className="rounded-full bg-gray-400 px-8 py-3 font-bold text-white transition hover:bg-gray-500">
                ล้างทั้งหมด
              </button>
              <button onClick={randomPaklak} className="rounded-full bg-white px-8 py-3 font-bold text-purple-600 shadow-lg transition hover:scale-105 active:scale-95">
                🎯 สุ่มปักหลัก (Enter)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
