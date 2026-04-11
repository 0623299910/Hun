"use client";
import { useState, useCallback, useEffect } from "react";

const STOCKS = [
  { name: "ดาวโจนส์", time: "03:20", flag: "🇺🇸" },
  { name: "นิเคอิเช้า", time: "09:30", flag: "🇯🇵" },
  { name: "จีนเช้า", time: "10:30", flag: "🇨🇳" },
  { name: "ฮั่งเส็งเช้า", time: "11:00", flag: "🇭🇰" },
  { name: "ไต้หวัน", time: "12:35", flag: "🇹🇼" },
  { name: "นิเคอิบ่าย", time: "13:00", flag: "🇯🇵" },
  { name: "เกาหลี", time: "13:35", flag: "🇰🇷" },
  { name: "จีนบ่าย", time: "14:00", flag: "🇨🇳" },
  { name: "ฮั่งเส็งบ่าย", time: "15:00", flag: "🇭🇰" },
  { name: "สิงคโปร์", time: "16:30", flag: "🇸🇬" },
  { name: "ไทยเย็น", time: "16:40", flag: "🇹🇭" },
  { name: "อินเดีย", time: "17:30", flag: "🇮🇳" },
  { name: "อียิปต์", time: "18:00", flag: "🇪🇬" },
  { name: "ฮานอย", time: "18:30", flag: "🇻🇳" },
  { name: "รัสเซีย", time: "19:00", flag: "🇷🇺" },
  { name: "เยอรมัน", time: "20:00", flag: "🇩🇪" },
  { name: "อังกฤษ", time: "21:00", flag: "🇬🇧" },
];

export default function ToolGPTSim() {
  const [results, setResults] = useState<{ top: string; bot: string }[]>([]);
  const [spinning, setSpinning] = useState(false);

  const randomAll = useCallback(() => {
    setSpinning(true);
    setTimeout(() => {
      setResults(STOCKS.map(() => ({
        top: Math.floor(Math.random() * 1000).toString().padStart(3, "0"),
        bot: Math.floor(Math.random() * 100).toString().padStart(2, "0"),
      })));
      setSpinning(false);
    }, 400);
  }, []);

  useEffect(() => { randomAll(); }, [randomAll]);

  const randomOne = (idx: number) => {
    setResults((prev) => {
      const next = [...prev];
      next[idx] = {
        top: Math.floor(Math.random() * 1000).toString().padStart(3, "0"),
        bot: Math.floor(Math.random() * 100).toString().padStart(2, "0"),
      };
      return next;
    });
  };

  return (
    <div className="min-h-[500px] rounded-2xl bg-gradient-to-br from-[#7b0000] to-[#d32f2f] p-4 text-white">
      <header className="mb-4 text-center text-2xl font-bold">🎰 สุ่มหวยหุ้น PRO</header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STOCKS.map((stock, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white p-4 text-gray-800 shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{stock.flag}</span>
              <div>
                <div className="text-lg font-bold">{stock.name}</div>
                <div className="text-xs text-gray-400">{stock.time}</div>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="space-y-1">
                <div className="text-xs text-gray-500">3 ตัวบน</div>
                <div className={`text-3xl font-bold text-red-600 ${spinning ? "animate-pulse" : ""}`}>
                  {results[i]?.top ?? "---"}
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="text-xs text-gray-500">2 ตัวล่าง</div>
                <div className={`text-3xl font-bold text-red-600 ${spinning ? "animate-pulse" : ""}`}>
                  {results[i]?.bot ?? "--"}
                </div>
              </div>
            </div>
            <button onClick={() => randomOne(i)} className="mt-3 w-full rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600">
              🎲 สุ่มใหม่
            </button>
          </div>
        ))}
      </div>

      <button onClick={randomAll} className="mx-auto mt-6 block rounded-xl bg-yellow-400 px-10 py-4 text-lg font-bold text-red-900 shadow-lg transition hover:bg-yellow-300">
        🎰 สุ่มทั้งหมด
      </button>

      <p className="mt-4 text-center text-xs text-white/50">⚠️ ข้อมูลนี้เป็นการจำลอง (Simulated)</p>
    </div>
  );
}
