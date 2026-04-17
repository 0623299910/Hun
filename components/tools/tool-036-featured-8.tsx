"use client";
import { useMemo } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/* ═══════════════════════════════════════════════════════════════
   36. รวมสูตรเลขเด่น 8 ตัว — 10 สูตร
   ─────────────────────────────────────────────────
   แต่ละสูตรให้เลข 0-9 จำนวน 8 ตัว (ไม่ซ้ำกัน)
   ที่คาดว่าจะปรากฏในเลข 2 ตัวล่าง (ทั้งหลักสิบและหลักหน่วย)
   ผ่าน = หลักสิบล่าง OR หลักหน่วยล่าง อยู่ใน 8 ตัวที่เลือก (ถูก 1-2 ตัว = ผ่าน, ผิดทั้ง 2 = ไม่ผ่าน)
   พร้อมสถิติย้อนหลัง 30 งวดล่าสุด
   ═══════════════════════════════════════════════════════════════ */

type ScoreFn = (dt: ParsedEntry[], upTo: number) => number[];

/** ให้คะแนน digit 0-9 → return top-8 (ไม่ซ้ำ) เรียงจากดีสุด */
function pickTop8(scores: number[]): number[] {
  const ranked = scores
    .map((s, digit) => ({ digit, score: s }))
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, 8).map((r) => r.digit).sort((a, b) => a - b);
}

/* ═══════ 10 สูตรให้คะแนน 0-9 ═══════ */

const FORMULAS: { name: string; desc: string; scoreFn: ScoreFn }[] = [
  /* 1 — Frequency: เลขที่ออกบ่อยทั้งหลักสิบและหลักหน่วย */
  {
    name: "ความถี่รวม",
    desc: "นับความถี่หลักสิบ+หน่วยล่างทุกงวด",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      for (let i = 0; i <= upTo; i++) {
        s[d(dt[i].bottom, 0)] += 1;
        s[d(dt[i].bottom, 1)] += 1;
      }
      return s;
    },
  },
  /* 2 — Recency: เลขที่เพิ่งออกเร็วๆ นี้ได้คะแนนสูง */
  {
    name: "ออกล่าสุด",
    desc: "เลขที่ห่างจากงวดปัจจุบันน้อย = คะแนนสูง",
    scoreFn: (dt, upTo) => {
      const lastSeen = Array(10).fill(-1);
      for (let i = 0; i <= upTo; i++) {
        lastSeen[d(dt[i].bottom, 0)] = i;
        lastSeen[d(dt[i].bottom, 1)] = i;
      }
      return lastSeen.map((ls) => (ls === -1 ? -999 : ls));
    },
  },
  /* 3 — Weighted Recency: ถ่วงน้ำหนักตำแหน่ง ยิ่งใกล้ยิ่งมากคะแนน */
  {
    name: "ถ่วงน้ำหนักใกล้",
    desc: "ถ่วง weight ให้งวดใกล้สุดมีคะแนนมากกว่า",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      for (let i = 0; i <= upTo; i++) {
        const w = i + 1;
        s[d(dt[i].bottom, 0)] += w;
        s[d(dt[i].bottom, 1)] += w;
      }
      return s;
    },
  },
  /* 4 — Follow Pattern: ดูว่าหลังแต้มปัจจุบัน เลขไหนมักตามมา */
  {
    name: "Follow Pattern",
    desc: "เลขที่มักตามหลังแต้มงวดปัจจุบัน",
    scoreFn: (dt, upTo) => {
      const curPt = mod10(d(dt[upTo].bottom, 0) + d(dt[upTo].bottom, 1));
      const s = Array(10).fill(0);
      for (let i = 0; i < upTo; i++) {
        const iPt = mod10(d(dt[i].bottom, 0) + d(dt[i].bottom, 1));
        if (iPt === curPt) {
          s[d(dt[i + 1].bottom, 0)] += 1;
          s[d(dt[i + 1].bottom, 1)] += 1;
        }
      }
      return s;
    },
  },
  /* 5 — ร้อย Chain: ดูว่าหลังหลักร้อยปัจจุบัน หลักสิบ+หน่วยล่างมักเป็นอะไร */
  {
    name: "ร้อย→ล่าง",
    desc: "เลขล่างที่มักตามหลักร้อยปัจจุบัน",
    scoreFn: (dt, upTo) => {
      const curH = d(dt[upTo].top, 0);
      const s = Array(10).fill(0);
      for (let i = 0; i < upTo; i++) {
        if (d(dt[i].top, 0) === curH) {
          s[d(dt[i + 1].bottom, 0)] += 1;
          s[d(dt[i + 1].bottom, 1)] += 1;
        }
      }
      return s;
    },
  },
  /* 6 — Sum Proximity: เลขที่ใกล้ผลรวม 3 ตัวบน mod 10 */
  {
    name: "ใกล้ผลรวมบน",
    desc: "ยิ่งใกล้ Σ3ตัวบน mod10 ยิ่งได้คะแนน",
    scoreFn: (dt, upTo) => {
      const sumTop = mod10(d(dt[upTo].top, 0) + d(dt[upTo].top, 1) + d(dt[upTo].top, 2));
      return Array.from({ length: 10 }, (_, i) => {
        const diff = Math.min(Math.abs(i - sumTop), 10 - Math.abs(i - sumTop));
        return 10 - diff;
      });
    },
  },
  /* 7 — Pair Buddy: เลขที่เคยจับคู่กับหลักสิบล่างปัจจุบัน */
  {
    name: "เพื่อนสิบล่าง",
    desc: "เลขที่เคยอยู่คู่กับหลักสิบล่างปัจจุบัน",
    scoreFn: (dt, upTo) => {
      const curT = d(dt[upTo].bottom, 0);
      const s = Array(10).fill(0);
      s[curT] += 2;
      for (let i = 0; i <= upTo; i++) {
        if (d(dt[i].bottom, 0) === curT) s[d(dt[i].bottom, 1)] += 1;
        if (d(dt[i].bottom, 1) === curT) s[d(dt[i].bottom, 0)] += 1;
      }
      return s;
    },
  },
  /* 8 — Parity+Range: เลขที่ตรงกับรูปแบบคู่-คี่ล่าสุด + ช่วงใกล้เคียง */
  {
    name: "คู่-คี่+ช่วง",
    desc: "เลขที่ตรงรูปแบบคู่/คี่ของ 3 งวดล่าสุด",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      const recentDigits: number[] = [];
      for (let i = Math.max(0, upTo - 2); i <= upTo; i++) {
        recentDigits.push(d(dt[i].bottom, 0), d(dt[i].bottom, 1));
      }
      const evenCount = recentDigits.filter((x) => x % 2 === 0).length;
      const oddCount = recentDigits.length - evenCount;
      const favorEven = evenCount >= oddCount;
      for (let i = 0; i < 10; i++) {
        if (favorEven && i % 2 === 0) s[i] += 3;
        if (!favorEven && i % 2 === 1) s[i] += 3;
        const minDist = recentDigits.reduce(
          (min, rd) => Math.min(min, Math.min(Math.abs(i - rd), 10 - Math.abs(i - rd))),
          10
        );
        s[i] += 5 - minDist;
      }
      return s;
    },
  },
  /* 9 — Streak Score: เลขที่ออกติดต่อกันหลายงวดได้คะแนนสูง */
  {
    name: "ออกติดต่อกัน",
    desc: "เลขที่ออกหลายงวดติดต่อกัน (streak)",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      for (let digit = 0; digit < 10; digit++) {
        let streak = 0;
        for (let i = upTo; i >= 0; i--) {
          if (d(dt[i].bottom, 0) === digit || d(dt[i].bottom, 1) === digit) {
            streak++;
          } else {
            break;
          }
        }
        s[digit] = streak * 3 + (s[digit] || 0);
      }
      // also add base frequency
      for (let i = 0; i <= upTo; i++) {
        s[d(dt[i].bottom, 0)] += 1;
        s[d(dt[i].bottom, 1)] += 1;
      }
      return s;
    },
  },
  /* 10 — Multi-Factor: รวมหลายปัจจัย (freq + recency + gap penalty) */
  {
    name: "รวมหลายปัจจัย",
    desc: "ผสม freq + recency + gap ให้คะแนนรวม",
    scoreFn: (dt, upTo) => {
      const freq = Array(10).fill(0);
      const lastSeen = Array(10).fill(-1);
      for (let i = 0; i <= upTo; i++) {
        const t = d(dt[i].bottom, 0);
        const u = d(dt[i].bottom, 1);
        freq[t]++;
        freq[u]++;
        lastSeen[t] = i;
        lastSeen[u] = i;
      }
      const n = upTo + 1;
      return Array.from({ length: 10 }, (_, i) => {
        const fScore = freq[i];
        const rScore = lastSeen[i] === -1 ? 0 : (lastSeen[i] / n) * 10;
        const gPenalty = lastSeen[i] === -1 ? 5 : (n - 1 - lastSeen[i]) * 0.5;
        return fScore * 2 + rScore * 3 - gPenalty;
      });
    },
  },
];

/* ─── types ─── */
interface ComputedFormula {
  idx: number;
  name: string;
  desc: string;
  picks: number[];
  eliminated: number[];
  pass: number;
  total: number;
  pct: number;
}

interface HistoryRow {
  date: string;
  bottom: string;
  results: { picks: number[]; pass: boolean }[];
  passCount: number;
}

interface ComputeResult {
  formulas: ComputedFormula[];
  consensus: { digit: number; count: number }[];
  history: HistoryRow[];
  avgPct: number;
}

/* ─── core compute ─── */
function compute(data: ParsedEntry[]): ComputeResult | null {
  if (data.length < 5) return null;
  const n = data.length;
  const BT_LEN = Math.min(30, n - 2);

  const formulas: ComputedFormula[] = FORMULAS.map((f, idx) => {
    const scores = f.scoreFn(data, n - 1);
    const picks = pickTop8(scores);
    const eliminated = Array.from({ length: 10 }, (_, i) => i).filter(
      (i) => !picks.includes(i)
    );

    let pass = 0;
    let total = 0;

    // backtest over all available data
    for (let i = 1; i < n - 1; i++) {
      const s = f.scoreFn(data, i);
      const p = pickTop8(s);
      const nextT = d(data[i + 1].bottom, 0);
      const nextU = d(data[i + 1].bottom, 1);
      total++;
      if (p.includes(nextT) || p.includes(nextU)) pass++;
    }

    return {
      idx: idx + 1,
      name: f.name,
      desc: f.desc,
      picks,
      eliminated,
      pass,
      total,
      pct: total > 0 ? (pass / total) * 100 : 0,
    };
  });

  /* consensus: digit → how many formulas picked it */
  const digitCount = Array(10).fill(0) as number[];
  formulas.forEach((f) => f.picks.forEach((p) => digitCount[p]++));
  const consensus = digitCount
    .map((count, digit) => ({ digit, count }))
    .sort((a, b) => b.count - a.count);

  /* history – last 30 draws */
  const history: HistoryRow[] = [];
  for (let i = n - 2; i >= Math.max(1, n - 1 - BT_LEN); i--) {
    const results = FORMULAS.map((f) => {
      const s = f.scoreFn(data, i);
      const p = pickTop8(s);
      const nextT = d(data[i + 1].bottom, 0);
      const nextU = d(data[i + 1].bottom, 1);
      return { picks: p, pass: p.includes(nextT) || p.includes(nextU) };
    });
    const passCount = results.filter((r) => r.pass).length;
    history.push({
      date: data[i + 1].date,
      bottom: data[i + 1].bottom,
      results,
      passCount,
    });
  }

  const avgPct = formulas.reduce((s, f) => s + f.pct, 0) / formulas.length;

  return { formulas, consensus, history, avgPct };
}

/* ─── color helpers ─── */
function tierColor(pct: number) {
  if (pct >= 75)
    return { text: "text-emerald-600", bg: "bg-emerald-500", border: "border-emerald-300", badge: "bg-emerald-100 text-emerald-700", from: "from-emerald-50" };
  if (pct >= 65)
    return { text: "text-blue-600", bg: "bg-blue-500", border: "border-blue-300", badge: "bg-blue-100 text-blue-700", from: "from-blue-50" };
  if (pct >= 55)
    return { text: "text-amber-600", bg: "bg-amber-500", border: "border-amber-300", badge: "bg-amber-100 text-amber-700", from: "from-amber-50" };
  return { text: "text-red-500", bg: "bg-red-500", border: "border-red-300", badge: "bg-red-100 text-red-700", from: "from-red-50" };
}

/* ─── inner component ─── */
function Results({
  result,
  showToast,
}: {
  result: ComputeResult;
  showToast: (msg: string) => void;
}) {
  const sorted = useMemo(
    () => [...result.formulas].sort((a, b) => b.pct - a.pct),
    [result.formulas]
  );

  return (
    <div className="animate-[fadeIn_0.5s] space-y-5">
      {/* ─── Consensus ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 p-4 text-white shadow-lg">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider opacity-80">
          🌟 ฉันทามติ — เลขที่หลายสูตรเลือกตรงกัน
        </div>
        <div className="flex flex-wrap gap-2">
          {result.consensus.map((c) => (
            <div key={c.digit} className="flex items-center gap-1">
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-black backdrop-blur-sm ${
                  c.count >= 10
                    ? "bg-white/30 ring-2 ring-white/60"
                    : c.count >= 8
                    ? "bg-white/20"
                    : "bg-white/10 opacity-60"
                }`}
              >
                {c.digit}
              </span>
              <span className="text-xs font-bold opacity-80">×{c.count}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] opacity-70">
          ความแม่นเฉลี่ยรวม {result.avgPct.toFixed(1)}% &nbsp;|&nbsp;
          ข้อมูลย้อนหลัง {result.formulas[0]?.total || 0} งวด
        </div>
      </div>

      {/* ─── 10 Formula Cards ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {result.formulas.map((f) => {
          const c = tierColor(f.pct);
          return (
            <div
              key={f.idx}
              className={`relative overflow-hidden rounded-xl border-2 ${c.border} bg-gradient-to-br ${c.from} to-white p-3 shadow-sm transition hover:shadow-md`}
            >
              {/* Badge */}
              <div
                className={`absolute -top-0.5 -left-0.5 rounded-br-lg ${c.badge} px-2 py-0.5 text-[10px] font-bold`}
              >
                #{f.idx}
              </div>

              {/* Name */}
              <div className="mt-3 text-[11px] font-bold leading-tight text-ink/70">
                {f.name}
              </div>
              <div className="text-[9px] leading-tight text-ink/40">
                {f.desc}
              </div>

              {/* 8 Picks */}
              <div className="my-2 flex flex-wrap justify-center gap-1">
                {f.picks.map((p) => (
                  <span
                    key={p}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${c.bg} text-sm font-black text-white shadow-sm`}
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Eliminated */}
              <div className="flex items-center justify-center gap-1 text-[10px] text-ink/40">
                ตัด:
                {f.eliminated.map((e) => (
                  <span
                    key={e}
                    className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-[10px] font-bold text-red-500"
                  >
                    {e}
                  </span>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200/60">
                <div
                  className={`h-full rounded-full ${c.bg} transition-all duration-500`}
                  style={{ width: `${Math.min(f.pct, 100)}%` }}
                />
              </div>

              {/* Pass rate */}
              <div className={`mt-1 text-right text-xs font-bold ${c.text}`}>
                {f.pct.toFixed(1)}%
                <span className="ml-1 text-[10px] font-normal text-ink/40">
                  ({f.pass}/{f.total})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Copy Best ─── */}
      <button
        onClick={() => {
          const best = [...result.formulas].sort((a, b) => b.pct - a.pct)[0];
          const text = best.picks.join(" ");
          copyText(text);
          showToast(`คัดลอกสูตร #${best.idx}: ${text}`);
        }}
        className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 py-3 text-center font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
      >
        📋 คัดลอกเลขเด่นจากสูตรแม่นที่สุด
      </button>

      {/* ─── Ranking Table ─── */}
      <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-4 py-3">
          <h3 className="text-sm font-bold text-ink/70">
            📊 อันดับความแม่นยำ (จากมากไปน้อย)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="px-3 py-2 text-left">อันดับ</th>
                <th className="px-3 py-2 text-left">สูตร</th>
                <th className="px-3 py-2 text-center">8 ตัวเด่น</th>
                <th className="px-3 py-2 text-center">ตัด</th>
                <th className="px-3 py-2 text-right">ถูก/รวม</th>
                <th className="px-3 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f, rank) => {
                const c = tierColor(f.pct);
                return (
                  <tr
                    key={f.idx}
                    className="border-t border-ink/5 hover:bg-gray-50/50"
                  >
                    <td className="px-3 py-2 font-bold text-ink/40">
                      {rank + 1}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-ink/80">
                        #{f.idx} {f.name}
                      </span>
                      <div className="text-[9px] text-ink/40">{f.desc}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap justify-center gap-[3px]">
                        {f.picks.map((p) => (
                          <span
                            key={p}
                            className={`inline-flex h-5 w-5 items-center justify-center rounded ${c.badge} text-[10px] font-bold`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-1">
                        {f.eliminated.map((e) => (
                          <span
                            key={e}
                            className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-[10px] font-bold text-red-500"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-ink/50">
                      {f.pass}/{f.total}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-bold ${c.text}`}
                    >
                      {f.pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Backtest History (30 draws) ─── */}
      <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-4 py-3">
          <h3 className="text-sm font-bold text-ink/70">
            📅 สถิติย้อนหลัง 30 งวดล่าสุด — 8 ตัวเด่นของแต่ละสูตร
          </h3>
          <p className="mt-0.5 text-[10px] text-ink/40">
            🟢 เขียว = 8 ตัวครอบทั้งหลักสิบ+หน่วย &nbsp;|&nbsp; � เหลือง = ถูก 1 ตัว &nbsp;|&nbsp; 🔴 แดง = พลาด (ผลจริงหลุดทั้ง 2 ตัว)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-bold text-ink/40">วันที่</th>
                <th className="px-2 py-2 text-center text-[10px] font-bold text-ink/40">ผลล่าง</th>
                {result.formulas.map((f) => (
                  <th key={f.idx} className="px-1 py-2 text-center">
                    <div className="text-[9px] font-bold text-ink/50">#{f.idx}</div>
                    <div className="text-[8px] font-normal text-ink/30 leading-tight max-w-[52px]">{f.name}</div>
                  </th>
                ))}
                <th className="px-2 py-2 text-center text-[10px] font-bold text-ink/40">รวม</th>
              </tr>
            </thead>
            <tbody>
              {result.history.map((h) => {
                const bottomT = parseInt(h.bottom[0]);
                const bottomU = parseInt(h.bottom[1]);
                return (
                  <tr key={h.date} className="border-t border-ink/5 hover:bg-gray-50/40">
                    <td className="whitespace-nowrap px-2 py-1.5 text-[10px] text-ink/50">{h.date}</td>
                    <td className="px-2 py-1.5 text-center font-black text-ink/80">{h.bottom}</td>
                    {h.results.map((r, fi) => {
                      const tIn = r.picks.includes(bottomT);
                      const uIn = r.picks.includes(bottomU);
                      const hitCount = (tIn ? 1 : 0) + (uIn ? 1 : 0);
                      return (
                        <td key={fi} className={`px-1 py-1.5 ${hitCount === 2 ? "bg-emerald-50" : hitCount === 1 ? "bg-yellow-50" : "bg-red-50/50"}`}>
                          <div className="flex flex-wrap justify-center gap-[2px]">
                            {r.picks.map((p) => {
                              const hit = p === bottomT || p === bottomU;
                              return (
                                <span
                                  key={p}
                                  className={`inline-flex h-[17px] w-[17px] items-center justify-center rounded text-[9px] font-bold ${
                                    hit
                                      ? "bg-emerald-500 text-white"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  {p}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center">
                      <span className={`text-xs font-bold ${h.passCount >= 8 ? "text-emerald-600" : h.passCount >= 6 ? "text-blue-500" : h.passCount >= 4 ? "text-amber-500" : "text-red-400"}`}>
                        {h.passCount}/10
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* ─── summary row: pass count per formula ─── */}
            <tfoot>
              <tr className="border-t-2 border-ink/10 bg-gray-50">
                <td colSpan={2} className="px-2 py-2 text-[10px] font-bold text-ink/50">รวมถูก / {result.history.length} งวด</td>
                {result.formulas.map((f) => {
                  const wins = result.history.filter((h) => h.results[f.idx - 1].pass).length;
                  const winPct = result.history.length > 0 ? (wins / result.history.length) * 100 : 0;
                  const c = tierColor(winPct);
                  return (
                    <td key={f.idx} className="px-1 py-2 text-center">
                      <div className={`text-[10px] font-black ${c.text}`}>{wins}</div>
                      <div className={`text-[9px] font-bold ${c.text}`}>{winPct.toFixed(0)}%</div>
                    </td>
                  );
                })}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── main export ─── */
export default function Tool036Featured8() {
  return (
    <ToolShell title="รวมสูตรเลขเด่น 8 ตัว — 10 สูตร" minEntries={5}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result = compute(data);
        return (
          <div className="space-y-5">
            <DataInput value={localInput} onChange={setLocalInput} />
            {result ? (
              <Results result={result} showToast={showToast} />
            ) : (
              <div className="rounded-xl bg-orange-50 p-6 text-center text-sm text-ink/50">
                ⏳ ต้องการข้อมูลอย่างน้อย 5 งวด (แนะนำ 30 งวดขึ้นไป)
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
