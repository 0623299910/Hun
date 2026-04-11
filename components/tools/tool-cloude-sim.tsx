"use client";
import { useState, useCallback, useEffect } from "react";

const STOCKS = [
  { name: "หุ้นดาวโจนส์", time: "03:20", flag: "🇺🇸" },
  { name: "หุ้นนิเคอิเช้า", time: "09:30", flag: "🇯🇵" },
  { name: "หุ้นจีนเช้า", time: "10:30", flag: "🇨🇳" },
  { name: "หุ้นฮั่งเส็งเช้า", time: "11:00", flag: "🇭🇰" },
  { name: "หุ้นไต้หวัน", time: "12:35", flag: "🇹🇼" },
  { name: "หุ้นนิเคอิบ่าย", time: "13:00", flag: "🇯🇵" },
  { name: "หุ้นเกาหลี", time: "13:35", flag: "🇰🇷" },
  { name: "หุ้นจีนบ่าย", time: "14:00", flag: "🇨🇳" },
  { name: "หุ้นฮั่งเส็งบ่าย", time: "15:00", flag: "🇭🇰" },
  { name: "หุ้นอินเดีย", time: "15:30", flag: "🇮🇳" },
  { name: "หุ้นสิงคโปร์", time: "16:30", flag: "🇸🇬" },
  { name: "หุ้นไทยเย็น", time: "16:40", flag: "🇹🇭" },
  { name: "หุ้นอียิปต์", time: "18:00", flag: "🇪🇬" },
  { name: "หุ้นฮานอย", time: "17:00", flag: "🇻🇳" },
  { name: "หุ้นรัสเซีย", time: "23:00", flag: "🇷🇺" },
  { name: "หุ้นเยอรมัน", time: "22:30", flag: "🇩🇪" },
  { name: "หุ้นอังกฤษ", time: "21:00", flag: "🇬🇧" },
];

const r3 = () => Math.floor(Math.random() * 1000).toString().padStart(3, "0");
const r2 = () => Math.floor(Math.random() * 100).toString().padStart(2, "0");

export default function ToolCloudeSim() {
  const [results, setResults] = useState<Record<number, { top3: string; bot2: string }>>({});
  const [loading, setLoading] = useState(false);
  const [updateTime, setUpdateTime] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    setResults({});
    setTimeout(() => {
      const newResults: Record<number, { top3: string; bot2: string }> = {};
      STOCKS.forEach((_, i) => { newResults[i] = { top3: r3(), bot2: r2() }; });
      setResults(newResults);
      setUpdateTime(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }));
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      <div className="bg-[#8B2323] p-4 text-white">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold">ผลหุ้นต่างประเทศ</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-80">{updateTime ? `อัปเดต: ${updateTime}` : ""}</span>
            <button onClick={fetchData} className={`rounded-full bg-white/10 p-1.5 transition hover:bg-white/20 ${loading ? "animate-spin" : ""}`}>
              🔄
            </button>
          </div>
        </div>
        <div className="mt-2 flex text-sm font-semibold">
          <div className="w-[45%] pl-2">รายการหวย</div>
          <div className="w-[30%] border-l border-white/20 text-center">3 ตัวบน</div>
          <div className="w-[25%] border-l border-white/20 text-center">2 ตัวล่าง</div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 bg-white">
        {STOCKS.map((stock, i) => {
          const result = results[i];
          return (
            <div key={i} className="flex items-center px-3 py-3 transition-colors hover:bg-gray-50">
              <div className="flex w-[45%] items-center gap-3">
                <span className="text-2xl">{stock.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-tight text-gray-700">{stock.name}</span>
                  <span className="mt-1 rounded-full bg-black px-2 py-0.5 text-[10px] font-mono text-white">{stock.time}</span>
                </div>
              </div>
              <div className="w-[30%] text-center">
                <span className={`text-lg font-bold tracking-wider text-gray-800 ${!result ? "inline-block h-6 w-12 animate-pulse rounded bg-gray-200" : ""}`}>
                  {result?.top3 ?? ""}
                </span>
              </div>
              <div className="w-[25%] text-center">
                <span className={`text-lg font-bold tracking-wider text-gray-800 ${!result ? "inline-block h-6 w-8 animate-pulse rounded bg-gray-200" : ""}`}>
                  {result?.bot2 ?? ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t bg-gray-50 p-3 text-center text-[10px] text-gray-400">
        ⚠️ ข้อมูลนี้เป็นการจำลองเพื่อแสดงผล UI เท่านั้น
      </div>
    </div>
  );
}
