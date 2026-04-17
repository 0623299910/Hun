"use client";
import { useMemo, useState } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/* ═══════════════════════════════════════════════════════════════
   38. เทียบปักหลักสิบ — 2 ชุด × 10 สูตร = 20 สูตร
   ─────────────────────────────────────────────────
   แต่ละสูตรให้เลขเด่นหลักสิบ 9 ตัว (0-9 ไม่ซ้ำ)
   ผ่าน = หลักสิบล่าง (bottom[0]) อยู่ใน 9 ตัวที่เลือก
   สถิติย้อนหลัง 20 งวด + จัดอันดับเดินดี
   สูตรชุด 1 กับชุด 2 ไม่ซ้ำกันเลยแม้แต่สูตรเดียว
   ═══════════════════════════════════════════════════════════════ */

type ScoreFn = (dt: ParsedEntry[], upTo: number) => number[];

/** ให้คะแนน digit 0-9 → return top-9 (ไม่ซ้ำ) เรียงจากน้อยไปมาก */
function pickTop9(scores: number[]): number[] {
  const ranked = scores
    .map((s, digit) => ({ digit, score: s }))
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, 9).map((r) => r.digit).sort((a, b) => a - b);
}

/* ═══════ ชุดที่ 1: 10 สูตร ═══════ */
const SET1_FORMULAS: { name: string; desc: string; scoreFn: ScoreFn }[] = [
  /* 1-1 ความถี่หลักสิบ */
  {
    name: "ความถี่สิบ",
    desc: "นับจำนวนครั้งที่หลักสิบล่างแต่ละตัวออก",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      for (let i = 0; i <= upTo; i++) s[d(dt[i].bottom, 0)]++;
      return s;
    },
  },
  /* 1-2 ออกล่าสุด */
  {
    name: "สิบออกล่าสุด",
    desc: "หลักสิบที่เพิ่งออกเร็วๆ นี้ได้คะแนนสูง",
    scoreFn: (dt, upTo) => {
      const lastSeen = Array(10).fill(-1);
      for (let i = 0; i <= upTo; i++) lastSeen[d(dt[i].bottom, 0)] = i;
      return lastSeen.map((ls) => (ls === -1 ? -999 : ls));
    },
  },
  /* 1-3 ถ่วงน้ำหนักใกล้ */
  {
    name: "ถ่วงน้ำหนักใกล้",
    desc: "งวดล่าสุดถ่วงน้ำหนักมากกว่า",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      for (let i = 0; i <= upTo; i++) s[d(dt[i].bottom, 0)] += i + 1;
      return s;
    },
  },
  /* 1-4 Follow หลังแต้ม */
  {
    name: "Follow แต้ม",
    desc: "สิบที่มักตามหลังแต้มงวดปัจจุบัน",
    scoreFn: (dt, upTo) => {
      const curPt = mod10(d(dt[upTo].bottom, 0) + d(dt[upTo].bottom, 1));
      const s = Array(10).fill(0);
      for (let i = 0; i < upTo; i++) {
        const iPt = mod10(d(dt[i].bottom, 0) + d(dt[i].bottom, 1));
        if (iPt === curPt) s[d(dt[i + 1].bottom, 0)]++;
      }
      return s;
    },
  },
  /* 1-5 ร้อย→สิบ */
  {
    name: "ร้อย→สิบ",
    desc: "สิบที่มักตามหลังหลักร้อยปัจจุบัน",
    scoreFn: (dt, upTo) => {
      const curH = d(dt[upTo].top, 0);
      const s = Array(10).fill(0);
      for (let i = 0; i < upTo; i++) {
        if (d(dt[i].top, 0) === curH) s[d(dt[i + 1].bottom, 0)]++;
      }
      return s;
    },
  },
  /* 1-6 ใกล้ผลรวมบน */
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
  /* 1-7 เพื่อนหน่วย */
  {
    name: "เพื่อนหน่วย",
    desc: "สิบที่เคยจับคู่กับหน่วยล่างปัจจุบัน",
    scoreFn: (dt, upTo) => {
      const curU = d(dt[upTo].bottom, 1);
      const s = Array(10).fill(0);
      for (let i = 0; i <= upTo; i++) {
        if (d(dt[i].bottom, 1) === curU) s[d(dt[i].bottom, 0)]++;
      }
      return s;
    },
  },
  /* 1-8 คู่-คี่+ช่วง */
  {
    name: "คู่-คี่+ช่วง",
    desc: "สิบตรงรูปแบบคู่/คี่ ของ 3 งวดล่าสุด",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      const recent: number[] = [];
      for (let i = Math.max(0, upTo - 2); i <= upTo; i++) recent.push(d(dt[i].bottom, 0));
      const evenC = recent.filter((x) => x % 2 === 0).length;
      const favorEven = evenC >= recent.length - evenC;
      for (let i = 0; i < 10; i++) {
        if (favorEven && i % 2 === 0) s[i] += 3;
        if (!favorEven && i % 2 === 1) s[i] += 3;
        const minDist = recent.reduce(
          (min, rd) => Math.min(min, Math.min(Math.abs(i - rd), 10 - Math.abs(i - rd))), 10
        );
        s[i] += 5 - minDist;
      }
      return s;
    },
  },
  /* 1-9 ออกติดต่อกัน (Streak) */
  {
    name: "ออกติดต่อกัน",
    desc: "สิบที่ออกติดต่อหลายงวดได้คะแนนสูง",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      for (let digit = 0; digit < 10; digit++) {
        let streak = 0;
        for (let i = upTo; i >= 0; i--) {
          if (d(dt[i].bottom, 0) === digit) streak++;
          else break;
        }
        s[digit] += streak * 4;
      }
      for (let i = 0; i <= upTo; i++) s[d(dt[i].bottom, 0)]++;
      return s;
    },
  },
  /* 1-10 รวมหลายปัจจัย */
  {
    name: "รวมหลายปัจจัย",
    desc: "ผสม freq + recency + gap",
    scoreFn: (dt, upTo) => {
      const freq = Array(10).fill(0);
      const lastSeen = Array(10).fill(-1);
      for (let i = 0; i <= upTo; i++) {
        freq[d(dt[i].bottom, 0)]++;
        lastSeen[d(dt[i].bottom, 0)] = i;
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

/* ═══════ ชุดที่ 2: 10 สูตร (ต่างจากชุด 1 ทุกสูตร) ═══════ */
const SET2_FORMULAS: { name: string; desc: string; scoreFn: ScoreFn }[] = [
  /* 2-1 Gap Inverse */
  {
    name: "หายไปนาน",
    desc: "สิบที่หายไปนาน ยิ่งมีโอกาสกลับมา",
    scoreFn: (dt, upTo) => {
      const lastSeen = Array(10).fill(-1);
      for (let i = 0; i <= upTo; i++) lastSeen[d(dt[i].bottom, 0)] = i;
      return lastSeen.map((ls) => {
        if (ls === -1) return upTo + 2;
        return upTo - ls;
      });
    },
  },
  /* 2-2 หน้าต่าง 5 งวด */
  {
    name: "หน้าต่าง 5 งวด",
    desc: "ความถี่สิบใน 5 งวดล่าสุดเท่านั้น",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      for (let i = Math.max(0, upTo - 4); i <= upTo; i++) s[d(dt[i].bottom, 0)] += 2;
      // เสริมด้วยความถี่รวมเล็กน้อย
      for (let i = 0; i <= upTo; i++) s[d(dt[i].bottom, 0)] += 0.1;
      return s;
    },
  },
  /* 2-3 ผลต่างลูกโซ่ */
  {
    name: "ผลต่างลูกโซ่",
    desc: "ทำนายจากผลต่างสิบ 3 งวดล่าสุด",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      if (upTo < 2) { s.fill(1); return s; }
      const t0 = d(dt[upTo].bottom, 0);
      const t1 = d(dt[upTo - 1].bottom, 0);
      const t2 = d(dt[upTo - 2].bottom, 0);
      const d1 = mod10(t0 - t1 + 10);
      const d2 = mod10(t1 - t2 + 10);
      const accel = mod10(d1 - d2 + 10);
      const predicted = mod10(t0 + mod10(d1 + accel));
      // ให้คะแนนตัวที่ใกล้ค่าทำนายมาก
      for (let i = 0; i < 10; i++) {
        const dist = Math.min(Math.abs(i - predicted), 10 - Math.abs(i - predicted));
        s[i] = 10 - dist;
      }
      return s;
    },
  },
  /* 2-4 กระจก 9-comp */
  {
    name: "กระจก 9-comp",
    desc: "ใช้ 9-complement ของหลักสิบย้อนกลับให้คะแนน",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      for (let i = 0; i <= upTo; i++) {
        const t = d(dt[i].bottom, 0);
        const mirror = (9 - t) % 10;
        s[mirror] += 1.5;
        s[t] += 0.5;
      }
      return s;
    },
  },
  /* 2-5 Cross ข้ามตำแหน่ง */
  {
    name: "Cross ตำแหน่ง",
    desc: "ผสมหลักร้อย+สิบบน+หน่วยบนชี้สิบล่าง",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      for (let i = 0; i < upTo; i++) {
        const cross = mod10(d(dt[i].top, 0) + d(dt[i].top, 1) + d(dt[i].top, 2) + d(dt[i].bottom, 1));
        const nextT = d(dt[i + 1].bottom, 0);
        if (cross === nextT) s[nextT] += 3;
        else s[nextT] += 1;
      }
      const curCross = mod10(d(dt[upTo].top, 0) + d(dt[upTo].top, 1) + d(dt[upTo].top, 2) + d(dt[upTo].bottom, 1));
      s[curCross] += 5;
      return s;
    },
  },
  /* 2-6 Fibonacci Offset */
  {
    name: "Fibonacci Offset",
    desc: "ออฟเซ็ตสิบจาก Fibonacci sequence",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
      const curT = d(dt[upTo].bottom, 0);
      for (const f of fib) {
        s[mod10(curT + f)] += 2;
        s[mod10(curT - f + 100)] += 1;
      }
      // base freq
      for (let i = 0; i <= upTo; i++) s[d(dt[i].bottom, 0)] += 0.3;
      return s;
    },
  },
  /* 2-7 Rotation Cycle */
  {
    name: "หมุนวนรอบ",
    desc: "หมุนตำแหน่งเลขเป็นวงกลมแบบ modular",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      for (let i = Math.max(0, upTo - 4); i <= upTo; i++) {
        const t = d(dt[i].bottom, 0);
        const offset = upTo - i + 1;
        s[mod10(t + offset)] += 2;
        s[mod10(t - offset + 10)] += 1;
      }
      for (let i = 0; i <= upTo; i++) s[d(dt[i].bottom, 0)] += 0.2;
      return s;
    },
  },
  /* 2-8 Markov Transition */
  {
    name: "Markov สิบ",
    desc: "ความน่าจะเป็น transition จากสิบปัจจุบัน",
    scoreFn: (dt, upTo) => {
      const trans = Array.from({ length: 10 }, () => Array(10).fill(0));
      for (let i = 0; i < upTo; i++) {
        trans[d(dt[i].bottom, 0)][d(dt[i + 1].bottom, 0)]++;
      }
      const cur = d(dt[upTo].bottom, 0);
      return trans[cur];
    },
  },
  /* 2-9 ผลรวม Digit สองงวด */
  {
    name: "ผลรวม Digit",
    desc: "ผลรวมตัวเลขข้ามงวดชี้เลขเด่น",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      if (upTo < 1) { s.fill(1); return s; }
      const sum1 = mod10(d(dt[upTo].bottom, 0) + d(dt[upTo].bottom, 1));
      const sum2 = mod10(d(dt[upTo - 1].bottom, 0) + d(dt[upTo - 1].bottom, 1));
      const sumTop = mod10(d(dt[upTo].top, 0) + d(dt[upTo].top, 1) + d(dt[upTo].top, 2));
      // วงรอบ ±
      for (let offset = 0; offset <= 4; offset++) {
        s[mod10(sum1 + offset)] += 3 - offset * 0.5;
        s[mod10(sum1 - offset + 10)] += 3 - offset * 0.5;
        s[mod10(sum2 + offset)] += 2 - offset * 0.3;
        s[mod10(sumTop + offset)] += 1;
      }
      return s;
    },
  },
  /* 2-10 Triple Weighted */
  {
    name: "Triple ถ่วง",
    desc: "ถ่วง 3 ชั้น: freq ร้อย+สิบบน+หน่วยบน→สิบล่าง",
    scoreFn: (dt, upTo) => {
      const s = Array(10).fill(0);
      const curH = d(dt[upTo].top, 0);
      const curTT = d(dt[upTo].top, 1);
      const curTU = d(dt[upTo].top, 2);
      for (let i = 0; i < upTo; i++) {
        const nextT = d(dt[i + 1].bottom, 0);
        if (d(dt[i].top, 0) === curH) s[nextT] += 3;
        if (d(dt[i].top, 1) === curTT) s[nextT] += 2;
        if (d(dt[i].top, 2) === curTU) s[nextT] += 1;
      }
      return s;
    },
  },
];

/* ─── types ─── */
interface ComputedFormula {
  idx: number;
  name: string;
  desc: string;
  picks: number[];
  eliminated: number;
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

interface SetResult {
  formulas: ComputedFormula[];
  history: HistoryRow[];
  avgPct: number;
}

/* ─── core compute for one set ─── */
function computeSet(
  data: ParsedEntry[],
  formulaDefs: { name: string; desc: string; scoreFn: ScoreFn }[]
): SetResult | null {
  if (data.length < 5) return null;
  const n = data.length;
  const BT_LEN = Math.min(20, n - 2);

  const formulas: ComputedFormula[] = formulaDefs.map((f, idx) => {
    const scores = f.scoreFn(data, n - 1);
    const picks = pickTop9(scores);
    const eliminated = Array.from({ length: 10 }, (_, i) => i).find(
      (i) => !picks.includes(i)
    ) ?? 0;

    let pass = 0;
    let total = 0;

    for (let i = 1; i < n - 1; i++) {
      const s = f.scoreFn(data, i);
      const p = pickTop9(s);
      const nextT = d(data[i + 1].bottom, 0);
      total++;
      if (p.includes(nextT)) pass++;
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

  /* history – last 20 draws */
  const history: HistoryRow[] = [];
  for (let i = n - 2; i >= Math.max(1, n - 1 - BT_LEN); i--) {
    const results = formulaDefs.map((f) => {
      const s = f.scoreFn(data, i);
      const p = pickTop9(s);
      const nextT = d(data[i + 1].bottom, 0);
      return { picks: p, pass: p.includes(nextT) };
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

  return { formulas, history, avgPct };
}

/* ─── color helpers ─── */
function tierColor(pct: number) {
  if (pct >= 90)
    return { text: "text-emerald-600", bg: "bg-emerald-500", border: "border-emerald-300", badge: "bg-emerald-100 text-emerald-700", from: "from-emerald-50" };
  if (pct >= 80)
    return { text: "text-blue-600", bg: "bg-blue-500", border: "border-blue-300", badge: "bg-blue-100 text-blue-700", from: "from-blue-50" };
  if (pct >= 70)
    return { text: "text-amber-600", bg: "bg-amber-500", border: "border-amber-300", badge: "bg-amber-100 text-amber-700", from: "from-amber-50" };
  return { text: "text-red-500", bg: "bg-red-500", border: "border-red-300", badge: "bg-red-100 text-red-700", from: "from-red-50" };
}

/* ─── SetPanel: render one set of 10 formulas ─── */
function SetPanel({
  setLabel,
  setNum,
  color,
  result,
  showToast,
}: {
  setLabel: string;
  setNum: number;
  color: { gradient: string; btn: string; headerBg: string };
  result: SetResult;
  showToast: (msg: string) => void;
}) {
  const sorted = useMemo(
    () => [...result.formulas].sort((a, b) => b.pct - a.pct),
    [result.formulas]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-2xl ${color.gradient} p-4 text-white shadow-lg`}>
        <div className="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
          {setLabel}
        </div>
        <div className="text-lg font-bold">
          เลขเด่นหลักสิบ 9 ตัว — 10 สูตร
        </div>
        <div className="mt-1 text-[11px] opacity-70">
          ความแม่นเฉลี่ย {result.avgPct.toFixed(1)}% &nbsp;|&nbsp;
          ข้อมูลย้อนหลัง {result.formulas[0]?.total || 0} งวด
        </div>
      </div>

      {/* 10 Formula Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {sorted.map((f, rank) => {
          const c = tierColor(f.pct);
          return (
            <div
              key={f.idx}
              className={`relative overflow-hidden rounded-xl border-2 ${c.border} bg-gradient-to-br ${c.from} to-white p-3 shadow-sm transition hover:shadow-md`}
            >
              <div
                className={`absolute -top-0.5 -left-0.5 rounded-br-lg ${c.badge} px-2 py-0.5 text-[10px] font-bold`}
              >
                #{rank + 1}
              </div>
              <div className="mt-3 text-[11px] font-bold leading-tight text-ink/70">
                {f.name}
              </div>
              <div className="text-[9px] leading-tight text-ink/40">{f.desc}</div>

              {/* 9 Picks */}
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
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-red-100 text-xs font-bold text-red-500">
                  {f.eliminated}
                </span>
              </div>

              {/* Progress */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200/60">
                <div
                  className={`h-full rounded-full ${c.bg} transition-all duration-500`}
                  style={{ width: `${Math.min(f.pct, 100)}%` }}
                />
              </div>
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

      {/* Copy Best */}
      <button
        onClick={() => {
          const best = sorted[0];
          const text = best.picks.join(" ");
          copyText(text);
          showToast(`คัดลอก ชุด${setNum} สูตร "${best.name}": ${text}`);
        }}
        className={`w-full rounded-xl ${color.btn} py-3 text-center font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]`}
      >
        📋 คัดลอกเลขเด่นจากสูตรแม่นที่สุด (ชุด {setNum})
      </button>

      {/* Ranking Table */}
      <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-4 py-3">
          <h3 className="text-sm font-bold text-ink/70">
            📊 อันดับความแม่นยำ ชุด {setNum} (มากไปน้อย)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="px-3 py-2 text-left">อันดับ</th>
                <th className="px-3 py-2 text-left">สูตร</th>
                <th className="px-3 py-2 text-center">9 ตัวเด่น</th>
                <th className="px-3 py-2 text-center">ตัด</th>
                <th className="px-3 py-2 text-right">ถูก/รวม</th>
                <th className="px-3 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f, rank) => {
                const c = tierColor(f.pct);
                return (
                  <tr key={f.idx} className="border-t border-ink/5 hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-bold text-ink/40">{rank + 1}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-ink/80">{f.name}</span>
                      <div className="text-[9px] text-ink/40">{f.desc}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap justify-center gap-[3px]">
                        {f.picks.map((p) => (
                          <span key={p} className={`inline-flex h-5 w-5 items-center justify-center rounded ${c.badge} text-[10px] font-bold`}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-[10px] font-bold text-red-500">
                        {f.eliminated}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-ink/50">{f.pass}/{f.total}</td>
                    <td className={`px-3 py-2 text-right font-bold ${c.text}`}>{f.pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backtest History (20 draws) */}
      <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-4 py-3">
          <h3 className="text-sm font-bold text-ink/70">
            📅 สถิติย้อนหลัง 20 งวด — ชุด {setNum}
          </h3>
          <p className="mt-0.5 text-[10px] text-ink/40">
            🟢 เขียว = หลักสิบอยู่ใน 9 ตัวเด่น &nbsp;|&nbsp; 🔴 แดง = หลักสิบหลุด
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-bold text-ink/40">วันที่</th>
                <th className="px-2 py-2 text-center text-[10px] font-bold text-ink/40">ล่าง</th>
                <th className="px-2 py-2 text-center text-[10px] font-bold text-ink/40">สิบ</th>
                {result.formulas.map((f) => (
                  <th key={f.idx} className="px-1 py-2 text-center">
                    <div className="text-[9px] font-bold text-ink/50">#{f.idx}</div>
                    <div className="max-w-[52px] text-[8px] font-normal leading-tight text-ink/30">{f.name}</div>
                  </th>
                ))}
                <th className="px-2 py-2 text-center text-[10px] font-bold text-ink/40">รวม</th>
              </tr>
            </thead>
            <tbody>
              {result.history.map((h) => {
                const tensDigit = parseInt(h.bottom[0]);
                return (
                  <tr key={h.date} className="border-t border-ink/5 hover:bg-gray-50/40">
                    <td className="whitespace-nowrap px-2 py-1.5 text-[10px] text-ink/50">{h.date}</td>
                    <td className="px-2 py-1.5 text-center font-black text-ink/80">{h.bottom}</td>
                    <td className="px-2 py-1.5 text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-black text-white">
                        {tensDigit}
                      </span>
                    </td>
                    {h.results.map((r, fi) => {
                      const hit = r.picks.includes(tensDigit);
                      return (
                        <td key={fi} className={`px-1 py-1.5 text-center ${hit ? "bg-emerald-50" : "bg-red-50/50"}`}>
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${hit ? "bg-emerald-500 text-white" : "bg-red-200 text-red-600"}`}>
                            {hit ? "✓" : "✗"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center">
                      <span className={`text-xs font-bold ${h.passCount >= 9 ? "text-emerald-600" : h.passCount >= 7 ? "text-blue-500" : h.passCount >= 5 ? "text-amber-500" : "text-red-400"}`}>
                        {h.passCount}/10
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink/10 bg-gray-50">
                <td colSpan={3} className="px-2 py-2 text-[10px] font-bold text-ink/50">ถูก / {result.history.length} งวด</td>
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
export default function Tool038CompareTensPin() {
  const [activeTab, setActiveTab] = useState<1 | 2>(1);

  return (
    <ToolShell title="เทียบปักหลักสิบ — 2 ชุด × 10 สูตร" minEntries={5}>
      {({ data, localInput, setLocalInput, showToast }) => {
        const result1 = computeSet(data, SET1_FORMULAS);
        const result2 = computeSet(data, SET2_FORMULAS);

        return (
          <div className="space-y-5">
            <DataInput value={localInput} onChange={setLocalInput} />

            {result1 && result2 ? (
              <>
                {/* Tab switcher */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab(1)}
                    className={`flex-1 rounded-xl py-3 text-center font-bold shadow transition ${
                      activeTab === 1
                        ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                        : "bg-white text-ink/50 hover:bg-purple-50"
                    }`}
                  >
                    ชุดที่ 1
                    <span className="ml-2 text-xs opacity-70">{result1.avgPct.toFixed(1)}%</span>
                  </button>
                  <button
                    onClick={() => setActiveTab(2)}
                    className={`flex-1 rounded-xl py-3 text-center font-bold shadow transition ${
                      activeTab === 2
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                        : "bg-white text-ink/50 hover:bg-cyan-50"
                    }`}
                  >
                    ชุดที่ 2
                    <span className="ml-2 text-xs opacity-70">{result2.avgPct.toFixed(1)}%</span>
                  </button>
                </div>

                {/* Panels */}
                <div className={activeTab === 1 ? "" : "hidden"}>
                  <SetPanel
                    setLabel="🟣 ชุดที่ 1 — สูตรพื้นฐาน+สถิติ"
                    setNum={1}
                    color={{
                      gradient: "bg-gradient-to-r from-violet-500 to-purple-600",
                      btn: "bg-gradient-to-r from-violet-500 to-purple-600",
                      headerBg: "bg-violet-50",
                    }}
                    result={result1}
                    showToast={showToast}
                  />
                </div>
                <div className={activeTab === 2 ? "" : "hidden"}>
                  <SetPanel
                    setLabel="🔵 ชุดที่ 2 — สูตรวิเคราะห์ขั้นสูง"
                    setNum={2}
                    color={{
                      gradient: "bg-gradient-to-r from-cyan-500 to-blue-600",
                      btn: "bg-gradient-to-r from-cyan-500 to-blue-600",
                      headerBg: "bg-cyan-50",
                    }}
                    result={result2}
                    showToast={showToast}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-purple-50 p-6 text-center text-sm text-ink/50">
                ⏳ ต้องการข้อมูลอย่างน้อย 5 งวด (แนะนำ 20 งวดขึ้นไป)
              </div>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
