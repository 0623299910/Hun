"use client";
import { useState, useCallback, useEffect } from "react";

const STOCKS = [
  { id: 1, name: "หุ้นดาวโจนส์", flagCode: "us", time: "03:20" },
  { id: 2, name: "หุ้นนิเคอิเช้า", flagCode: "jp", time: "09:30" },
  { id: 3, name: "หุ้นจีนเช้า", flagCode: "cn", time: "10:30" },
  { id: 4, name: "หุ้นฮั่งเส็งเช้า", flagCode: "hk", time: "11:00" },
  { id: 5, name: "หุ้นไต้หวัน", flagCode: "tw", time: "12:35" },
  { id: 6, name: "หุ้นนิเคอิบ่าย", flagCode: "jp", time: "13:00" },
  { id: 7, name: "หุ้นเกาหลี", flagCode: "kr", time: "13:35" },
  { id: 8, name: "หุ้นจีนบ่าย", flagCode: "cn", time: "14:00" },
  { id: 9, name: "หุ้นฮั่งเส็งบ่าย", flagCode: "hk", time: "15:00" },
  { id: 10, name: "หุ้นสิงคโปร์", flagCode: "sg", time: "16:30" },
  { id: 11, name: "หุ้นไทยเย็น", flagCode: "th", time: "16:40" },
  { id: 12, name: "หุ้นอินเดีย", flagCode: "in", time: "17:30" },
  { id: 13, name: "หุ้นอียิปต์", flagCode: "eg", time: "20:00" },
  { id: 14, name: "หุ้นอังกฤษ", flagCode: "gb", time: "23:00" },
  { id: 15, name: "หุ้นรัสเซีย", flagCode: "ru", time: "23:00" },
  { id: 16, name: "หุ้นเยอรมัน", flagCode: "de", time: "23:00" },
];

export default function ToolSimulator() {
  const [results, setResults] = useState<Record<number, { top3: string; bottom2: string }>>({});
  const [loading, setLoading] = useState(false);
  const [updateTime, setUpdateTime] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    setResults({});
    setTimeout(() => {
      const newResults: Record<number, { top3: string; bottom2: string }> = {};
      STOCKS.forEach((stock) => {
        newResults[stock.id] = {
          top3: Math.floor(Math.random() * 1000).toString().padStart(3, "0"),
          bottom2: Math.floor(Math.random() * 100).toString().padStart(2, "0"),
        };
      });
      setResults(newResults);
      setUpdateTime(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }));
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 60000); return () => clearInterval(interval); }, [fetchData]);

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-xl border bg-white shadow-xl">
      <div className="bg-[#8B2323] p-4 text-white">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold">ผลหุ้นต่างประเทศ</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-80">{updateTime ? `อัปเดต: ${updateTime}` : "กำลังโหลด..."}</span>
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

      <div className="divide-y divide-gray-100">
        {STOCKS.map((stock) => {
          const result = results[stock.id];
          return (
            <div key={stock.id} className="flex items-center px-3 py-3 transition-colors hover:bg-gray-50">
              <div className="flex w-[45%] items-center gap-3">
                <img
                  src={`https://flagcdn.com/w40/${stock.flagCode}.png`}
                  alt={stock.name}
                  className="h-8 w-8 rounded-full border border-gray-100 bg-gray-200 object-cover shadow-sm"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
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
                  {result?.bottom2 ?? ""}
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
