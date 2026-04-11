"use client";
import { useState, useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, copyText } from "@/lib/data-parser";

/* ---------- helpers ---------- */
interface AnalysisResult { digit: number; score: number }

function analyzeSingleFreq(data: ParsedEntry[]) {
  const freq = Array(10).fill(0);
  const lastSeen = Array(10).fill(-1);
  data.forEach((e, idx) => {
    const t = parseInt(e.bottom[0]), u = parseInt(e.bottom[1]);
    freq[t]++; freq[u]++;
    lastSeen[t] = idx; lastSeen[u] = idx;
  });
  const gaps = freq.map((_, i) => (lastSeen[i] === -1 ? data.length : data.length - 1 - lastSeen[i]));
  return { freq, gaps };
}

function analyzeBalanced(data: ParsedEntry[]): AnalysisResult[] {
  const { freq, gaps } = analyzeSingleFreq(data);
  return freq.map((f, i) => {
    let score = 0;
    if (f === 0) score += 100;
    else score += (1 - f / (data.length * 2)) * 50;
    score += (gaps[i] / data.length) * 50;
    return { digit: i, score };
  }).sort((a, b) => b.score - a.score);
}

function analyzeHot(data: ParsedEntry[]): AnalysisResult[] {
  const slice = data.slice(-15);
  const freq = Array(10).fill(0);
  slice.forEach((e) => { freq[parseInt(e.bottom[0])]++; freq[parseInt(e.bottom[1])]++; });
  return freq.map((f, i) => ({ digit: i, score: f })).sort((a, b) => b.score - a.score);
}

function analyzeCold(data: ParsedEntry[]): AnalysisResult[] {
  const { freq, gaps } = analyzeSingleFreq(data);
  return freq.map((f, i) => ({
    digit: i,
    score: gaps[i] * 0.7 + (1 - f / (data.length * 2)) * 100 * 0.3,
  })).sort((a, b) => b.score - a.score);
}

function analyzeTrend(data: ParsedEntry[]): AnalysisResult[] {
  const { gaps } = analyzeSingleFreq(data);
  const follow: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  for (let i = 0; i < data.length - 1; i++) {
    const prevT = parseInt(data[i].bottom[0]), prevU = parseInt(data[i].bottom[1]);
    const nextT = parseInt(data[i + 1].bottom[0]), nextU = parseInt(data[i + 1].bottom[1]);
    follow[prevT][nextT]++; follow[prevT][nextU]++;
    follow[prevU][nextT]++; follow[prevU][nextU]++;
  }
  const last = data[data.length - 1];
  const lt = parseInt(last.bottom[0]), lu = parseInt(last.bottom[1]);
  const scores = Array(10).fill(0);
  for (let d = 0; d < 10; d++) {
    scores[d] += follow[lt][d] * 2 + follow[lu][d] * 2;
    if (gaps[d] > 5) scores[d] += 20;
  }
  return scores.map((s, i) => ({ digit: i, score: s })).sort((a, b) => b.score - a.score);
}

function analyzeWeighted(data: ParsedEntry[]): AnalysisResult[] {
  const { freq, gaps } = analyzeSingleFreq(data);
  const weights = freq.map((f, i) => Math.max(1, gaps[i]) * Math.max(1, data.length * 2 - f));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w, i) => ({ digit: i, score: (w / total) * 100 })).sort((a, b) => b.score - a.score);
}

function analyzeMath(data: ParsedEntry[]): AnalysisResult[] {
  const { freq, gaps } = analyzeSingleFreq(data);
  const fibs = new Set([0, 1, 2, 3, 5, 8]);
  const primes = new Set([2, 3, 5, 7]);
  const squares = new Set([0, 1, 4, 9]);
  return freq.map((f, i) => {
    let score = 0;
    if (fibs.has(i)) score += 30;
    if (primes.has(i)) score += 25;
    if (squares.has(i)) score += 20;
    score += gaps[i] * 2;
    if (f < data.length * 0.15) score += 25;
    return { digit: i, score };
  }).sort((a, b) => b.score - a.score);
}

/* 2-digit analysis */
function analyze2Digit(data: ParsedEntry[]) {
  const freq: Record<string, number> = {};
  for (let i = 0; i < 100; i++) freq[i.toString().padStart(2, "0")] = 0;
  data.forEach((e) => { freq[e.bottom] = (freq[e.bottom] || 0) + 1; });

  const gapMap: Record<string, number> = {};
  const lastSeen: Record<string, number> = {};
  data.forEach((e, idx) => { lastSeen[e.bottom] = idx; });
  for (const k of Object.keys(freq)) {
    gapMap[k] = lastSeen[k] !== undefined ? data.length - 1 - lastSeen[k] : data.length;
  }

  const probScores = Object.entries(freq).map(([num, f]) => {
    let score = 0;
    if (f === 0) score += 100;
    else score += (1 - f / data.length) * 50;
    score += (gapMap[num] / data.length) * 30;
    return { num, score, freq: f, gap: gapMap[num] };
  }).sort((a, b) => b.score - a.score);

  return { freq, gapMap, probScores };
}

const MODES = [
  { id: "balanced", name: "สมดุล (Balanced)", fn: analyzeBalanced },
  { id: "hot", name: "เลขร้อน (Hot 15)", fn: analyzeHot },
  { id: "cold", name: "เลขเย็น (Cold)", fn: analyzeCold },
  { id: "trend", name: "แนวโน้ม (Trend)", fn: analyzeTrend },
  { id: "weighted", name: "ถ่วงน้ำหนัก (Weighted)", fn: analyzeWeighted },
  { id: "math", name: "คณิตศาสตร์ (Math)", fn: analyzeMath },
];

export default function Tool003AllInOne() {
  const [mode, setMode] = useState("balanced");
  const [view, setView] = useState<"single" | "2digit">("single");

  return (
    <ToolShell title="All in One" minEntries={5}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const modeResult = useMemo(() => {
          if (data.length < 5) return [];
          const fn = MODES.find((m) => m.id === mode)?.fn ?? analyzeBalanced;
          return fn(data);
        }, [data, mode]);

        const top7 = modeResult.slice(0, 7).map((r) => r.digit);
        const bottom3 = modeResult.slice(7).map((r) => r.digit);

        /* backtest: last 20 draws */
        const backtest = useMemo(() => {
          if (data.length < 7) return { hits: 0, total: 0 };
          const checks = Math.min(20, data.length - 5);
          let hits = 0;
          for (let i = 0; i < checks; i++) {
            const idx = data.length - 1 - i;
            const train = data.slice(0, idx);
            if (train.length < 5) continue;
            const results = analyzeBalanced(train);
            const prediction = results.slice(0, 7).map((r) => r.digit);
            const actual = data[idx];
            const t = parseInt(actual.bottom[0]), u = parseInt(actual.bottom[1]);
            if (prediction.includes(t) || prediction.includes(u)) hits++;
          }
          return { hits, total: checks };
        }, [data]);

        /* 2-digit analysis */
        const twoDigit = useMemo(() => {
          if (data.length < 5) return null;
          return analyze2Digit(data);
        }, [data]);

        return (
          <div className="space-y-4">
            <DataInput value={localInput} onChange={setLocalInput} />

            {data.length >= 5 && (
              <div className="space-y-4 animate-[fadeIn_0.3s]">
                {/* View toggle */}
                <div className="flex gap-2">
                  <button onClick={() => setView("single")} className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${view === "single" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600"}`}>
                    วิเคราะห์ 1 หลัก
                  </button>
                  <button onClick={() => setView("2digit")} className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${view === "2digit" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600"}`}>
                    วิเคราะห์ 2 หลัก
                  </button>
                </div>

                {view === "single" && (
                  <>
                    {/* Mode selector */}
                    <div className="flex flex-wrap gap-2">
                      {MODES.map((m) => (
                        <button key={m.id} onClick={() => setMode(m.id)}
                          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${mode === m.id ? "bg-indigo-600 text-white shadow" : "bg-white border border-ink/15 text-ink/60 hover:bg-indigo-50"}`}>
                          {m.name}
                        </button>
                      ))}
                    </div>

                    {/* Top 7 */}
                    <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5">
                      <h3 className="mb-3 font-bold text-green-800">✨ เลขมาแรง 7 ตัว (โหมด: {MODES.find((m) => m.id === mode)?.name})</h3>
                      <div className="flex flex-wrap justify-center gap-3">
                        {top7.sort((a, b) => a - b).map((d) => (
                          <span key={d} className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-2xl font-black text-white shadow-lg">{d}</span>
                        ))}
                      </div>
                      <button onClick={() => { copyText(top7.sort((a, b) => a - b).join("")); showToast("คัดลอกเลข 7 ตัว"); }}
                        className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm font-bold text-white transition hover:bg-green-700">
                        📋 คัดลอก
                      </button>
                    </div>

                    {/* Bottom 3 (dead) */}
                    <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
                      <h3 className="mb-3 font-bold text-red-700">🚫 เลขเย็น 3 ตัว (ดับ)</h3>
                      <div className="flex justify-center gap-3">
                        {bottom3.sort((a, b) => a - b).map((d) => (
                          <span key={d} className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-2xl font-black text-white shadow">{d}</span>
                        ))}
                      </div>
                    </div>

                    {/* Scores table */}
                    <div className="overflow-auto rounded-lg border text-xs" style={{ maxHeight: 300 }}>
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-50"><tr className="border-b text-center font-bold">
                          <th className="p-2">อันดับ</th><th className="p-2">เลข</th><th className="p-2">คะแนน</th><th className="p-2">สถานะ</th>
                        </tr></thead>
                        <tbody>{modeResult.map((r, i) => (
                          <tr key={r.digit} className={`border-b text-center hover:bg-gray-50 ${i < 7 ? "bg-green-50" : "bg-red-50"}`}>
                            <td className="p-2">{i + 1}</td>
                            <td className="p-2 text-lg font-bold">{r.digit}</td>
                            <td className="p-2">{r.score.toFixed(1)}</td>
                            <td className={`p-2 font-bold ${i < 7 ? "text-green-600" : "text-red-600"}`}>{i < 7 ? "มาแรง" : "เลขเย็น"}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>

                    {/* Backtest */}
                    <div className="rounded-lg border bg-white p-4 shadow-sm text-center">
                      <h4 className="text-sm font-bold text-ink/70 mb-1">Backtest (Balanced Mode)</h4>
                      <div className="text-3xl font-black text-indigo-600">{backtest.total > 0 ? ((backtest.hits / backtest.total) * 100).toFixed(0) : 0}%</div>
                      <p className="text-xs text-ink/50">ถูก {backtest.hits} / {backtest.total} งวดล่าสุด</p>
                    </div>
                  </>
                )}

                {view === "2digit" && twoDigit && (
                  <div className="space-y-4">
                    {/* Top probability */}
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                      <h3 className="mb-3 font-bold text-ink">🎯 เลข 2 ตัวที่น่าจับตา (Top 20)</h3>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                        {twoDigit.probScores.slice(0, 20).map((ps) => (
                          <div key={ps.num} className="rounded-lg border bg-indigo-50 p-2 text-center">
                            <div className="text-lg font-bold text-indigo-700">{ps.num}</div>
                            <div className="text-[9px] text-ink/50">ห่าง {ps.gap}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Heat map */}
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                      <h3 className="mb-3 font-bold text-ink">🔥 Heat Map ความถี่ 2 ตัว</h3>
                      <div className="grid grid-cols-10 gap-1">
                        {Array.from({ length: 100 }, (_, i) => {
                          const num = i.toString().padStart(2, "0");
                          const f = twoDigit.freq[num] || 0;
                          const maxF = Math.max(...Object.values(twoDigit.freq), 1);
                          const ratio = f / maxF;
                          const bg = f === 0 ? "bg-gray-100 text-gray-300" : ratio > 0.8 ? "bg-red-500 text-white" : ratio > 0.6 ? "bg-orange-400 text-white" : ratio > 0.4 ? "bg-yellow-400 text-gray-800" : ratio > 0.2 ? "bg-blue-200 text-blue-800" : "bg-blue-50 text-blue-600";
                          return (
                            <div key={num} className={`rounded p-0.5 text-center text-[8px] font-bold ${bg}`} title={`${num}: ${f} ครั้ง`}>
                              {num}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-ink/50">
                        <span className="inline-block h-3 w-3 rounded bg-gray-100" /> 0
                        <span className="inline-block h-3 w-3 rounded bg-blue-200" /> น้อย
                        <span className="inline-block h-3 w-3 rounded bg-yellow-400" /> ปานกลาง
                        <span className="inline-block h-3 w-3 rounded bg-orange-400" /> มาก
                        <span className="inline-block h-3 w-3 rounded bg-red-500" /> มากสุด
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
