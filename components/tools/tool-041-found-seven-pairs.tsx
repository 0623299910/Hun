"use client";
import { useState, useMemo } from "react";

/*
  41. คู่ดับสองตัวล่าง — Found Seven Formulas
  ดึงสูตรจากไฟล์ "Found Seven.xlsx" (ชีต ผล + คู่ดับหลัก + ดับสิบหน่วยล่าง)
  ─────────────────────────────────────────────────────────────────
  Input : สามตัวบน (3 หลัก) + สองตัวล่าง (2 หลัก) ของงวดล่าสุด
  Output: คู่ดับสองตัวล่าง จาก 6 กลุ่มสูตร + ตาราง heatmap 10×10
*/

// ── helpers ────────────────────────────────────────────────────
function m10(n: number): number { return ((n % 10) + 10) % 10; }
function pad3(n: number): string { return String(((n % 1000) + 1000) % 1000).padStart(3, "0"); }
function pad2(n: number): string { return String(((n % 100) + 100) % 100).padStart(2, "0"); }

// ── colour palette for heatmap ──────────────────────────────────
const HEAT = [
  "bg-zinc-800/60 text-zinc-500",       // 0
  "bg-blue-900/50 text-blue-300",       // 1
  "bg-cyan-800/50 text-cyan-200",       // 2
  "bg-teal-700/60 text-teal-100",       // 3
  "bg-emerald-600/60 text-white",       // 4
  "bg-green-500/70 text-white font-bold", // 5
  "bg-yellow-500/80 text-zinc-900 font-bold", // 6
  "bg-orange-500/80 text-white font-bold",    // 7
  "bg-red-500/80 text-white font-bold font-extrabold", // 8+
];

function heatClass(v: number): string { return HEAT[Math.min(v, HEAT.length - 1)]; }

// ── formula spec ────────────────────────────────────────────────
interface FormulaGroup {
  groupId: string;
  groupName: string;
  formulas: Formula[];
}
interface Formula {
  id: string;
  name: string;
  desc: string;
  color: string;     // Tailwind accent colour for badge
  result: string;    // "3d" or "2d"
  value: string;     // the computed string (3- or 2-digit)
  deadDigits: number[]; // for 3d: all 3 dead digits; for 2d: [tens,units]
  isPair: boolean;   // true = specific dead pair; false = dead-digit set
}

// ── core computation ────────────────────────────────────────────
function computeFormulas(top: string, bot: string): { groups: FormulaGroup[]; heatmap: number[] } {
  const H = +top[0], I = +top[1], J = +top[2];
  const K = +bot[0], L = +bot[1];
  const E = +top, F = +bot;

  // helper: make a 3-digit formula entry
  function fd3(id: string, name: string, desc: string, color: string, num: number): Formula {
    const v = pad3(num);
    return { id, name, desc, color, result: "3d", value: v, deadDigits: [+v[0], +v[1], +v[2]], isPair: false };
  }
  // helper: make a 2-digit (pair) formula entry
  function fd2(id: string, name: string, desc: string, color: string, num: number): Formula {
    const v = pad2(num);
    return { id, name, desc, color, result: "2d", value: v, deadDigits: [+v[0], +v[1]], isPair: true };
  }

  // ── กลุ่มที่ 1: สูตรคูณและผลรวม (ชีต ผล คอลัมน์ P,Q,R,S,T,U) ─────
  const g1: Formula[] = [
    fd3("P", "×7", `${E} × 7 (3 หลักท้าย)`, "indigo", E * 7),
    fd3("Q", "×3", `${E} × 3 (3 หลักท้าย)`, "violet", E * 3),
    fd3("R", "สาม+สอง", `${E} + ${F} (3 หลักท้าย)`, "sky", E + F),
    fd3("S", "+567", `${F} + 567 (3 หลักท้าย)`, "blue", F + 567),
    fd3("T", "+789", `${E} + 789 (3 หลักท้าย)`, "cyan", E + 789),
    fd3("U", "รวม+567", `${E} + ${F} + 567 (3 หลักท้าย)`, "teal", E + F + 567),
  ];

  // ── กลุ่มที่ 2: คูณหลักเดี่ยว ×7 / ×8 (ชีต ผล คอลัมน์ W,X,Y,Z,AB,AC) ─
  const g2: Formula[] = [
    fd2("W", "หน่วยล่าง×7", `${L} × 7`, "emerald", L * 7),
    fd2("X", "หน่วยล่าง×8", `${L} × 8`, "green", L * 8),
    fd2("Y", "สิบล่าง×7",   `${K} × 7`, "lime", K * 7),
    fd2("Z", "สิบล่าง×8",   `${K} × 8`, "yellow", K * 8),
    fd2("AB","หน่วยบน×7",   `${J} × 7`, "amber", J * 7),
    fd2("AC","หน่วยบน×8",   `${J} × 8`, "orange", J * 8),
  ];

  // ── กลุ่มที่ 3: โซ่หน่วยล่าง +1+3+3 (ชีต คู่ดับหลัก BX-CC) ──────────
  // Chain A: L+1, L+4, L+7
  const bx = m10(L + 1), by = m10(L + 4), bz = m10(L + 7);
  // Chain B: L+2, L+5, L+8
  const ca = m10(L + 2), cb = m10(L + 5), cc = m10(L + 8);
  // Sums of chains
  const cd = m10(bx + by + bz);
  const ce = m10(ca + cb + cc);

  const g3chain: Formula[] = [
    {
      id: "chainA", name: "โซ่หน่วยล่าง (ชุด1)", desc: `L+1,+3,+3 → ${bx},${by},${bz}`,
      color: "rose", result: "3d", value: `${bx}${by}${bz}`,
      deadDigits: [bx, by, bz], isPair: false,
    },
    {
      id: "chainB", name: "โซ่หน่วยล่าง (ชุด2)", desc: `L+2,+3,+3 → ${ca},${cb},${cc}`,
      color: "pink", result: "3d", value: `${ca}${cb}${cc}`,
      deadDigits: [ca, cb, cc], isPair: false,
    },
    {
      id: "chainSum", name: "ผลรวมโซ่", desc: `(${bx}+${by}+${bz})%10=${cd} / (${ca}+${cb}+${cc})%10=${ce}`,
      color: "fuchsia", result: "2d", value: `${cd}${ce}`,
      deadDigits: [cd, ce], isPair: true,
    },
  ];

  // ── กลุ่มที่ 4: โซ่ร้อยบน +4 (ชีต คู่ดับหลัก CT-CW) ─────────────────
  const ct = m10(H + 4), cu = m10(H + 8), cv = m10(H + 2), cw = m10(H + 6);

  const g4chain: Formula[] = [
    {
      id: "chainH", name: "โซ่ร้อยบน +4", desc: `H+4,+4,+4,+4 → ${ct},${cu},${cv},${cw}`,
      color: "red", result: "3d", value: `${ct}${cu}${cv}${cw}`.slice(0, 3),
      deadDigits: [ct, cu, cv, cw], isPair: false,
    },
    fd2("CTCW","ร้อย+4 vs ร้อย+16",  `(H+4)=(${ct}), (H+16)=(${cw})`, "red", ct * 10 + cw),
    fd2("CUCT","ร้อย+4 vs ร้อย+8",   `(H+4)=(${ct}), (H+8)=(${cu})`, "rose", ct * 10 + cu),
  ];

  // ── กลุ่มที่ 5: รวมหลัก (ชีต ผล คอลัมน์ BC,BD) ─────────────────────
  const bc = m10(H + I), bd = m10(I + J);
  const g5: Formula[] = [
    {
      id: "BC", name: "ร้อย+สิบ", desc: `(${H}+${I})%10 = ${bc}`,
      color: "slate", result: "3d", value: `${bc}${bd}0`,
      deadDigits: [bc, bd], isPair: false,
    },
    fd2("BCBD", "ร้อย+สิบ × สิบ+หน่วย", `${bc} สิบ, ${bd} หน่วย`, "zinc", bc * 10 + bd),
  ];

  // ── กลุ่มที่ 6: เลขเด่นจาก BX,BZ, CB,CC (คู่ดับเทพ) ───────────────
  const g6: Formula[] = [
    fd2("pair1", "โซ่คู่ 1 (BX,BZ)",  `สิบ=${bx}, หน่วย=${bz}`, "purple", bx * 10 + bz),
    fd2("pair2", "โซ่คู่ 2 (CB,CC)",  `สิบ=${cb}, หน่วย=${cc}`, "violet", cb * 10 + cc),
    fd2("pair3", "โซ่คู่ 3 (CT,CW)",  `สิบ=${ct}, หน่วย=${cw}`, "indigo", ct * 10 + cw),
    fd2("pair4", "โซ่คู่ 4 (BX,CA)",  `สิบ=${bx}, หน่วย=${ca}`, "blue",   bx * 10 + ca),
    fd2("pair5", "รวม+สิบล่าง", `K+L+7=${K+L+7}, หน่วย=${m10(K+L+7)}`, "sky", (K+L+7) * 10 + m10(K+L+7)),
  ];

  const groups: FormulaGroup[] = [
    { groupId: "g1", groupName: "สูตรคูณ / ผลรวม (3 หลัก)", formulas: g1 },
    { groupId: "g2", groupName: "คูณหลักเดี่ยว ×7 / ×8 (คู่ตรง)", formulas: g2 },
    { groupId: "g3", groupName: "โซ่หน่วยล่าง +1+3+3", formulas: g3chain },
    { groupId: "g4", groupName: "โซ่ร้อยบน +4", formulas: g4chain },
    { groupId: "g5", groupName: "รวมหลัก (ร้อย+สิบ / สิบ+หน่วย)", formulas: g5 },
    { groupId: "g6", groupName: "คู่ดับเทพ (จับโซ่)", formulas: g6 },
  ];

  // ── build heatmap [100] ─────────────────────────────────────
  const heat = new Array(100).fill(0);

  function killDigits(digits: number[]) {
    const set = new Set(digits);
    for (let t = 0; t < 10; t++)
      for (let u = 0; u < 10; u++)
        if (set.has(t) || set.has(u)) heat[t * 10 + u]++;
  }

  function killPair(tens: number, units: number) {
    heat[tens * 10 + units]++;
  }

  for (const g of groups) {
    for (const f of g.formulas) {
      if (f.isPair) {
        killPair(f.deadDigits[0], f.deadDigits[1]);
      } else {
        killDigits(f.deadDigits);
      }
    }
  }

  return { groups, heatmap: heat };
}

// ── badge colour → Tailwind classes ──────────────────────────────
const BADGE: Record<string, string> = {
  indigo:  "bg-indigo-600 text-white",
  violet:  "bg-violet-600 text-white",
  sky:     "bg-sky-600 text-white",
  blue:    "bg-blue-600 text-white",
  cyan:    "bg-cyan-600 text-white",
  teal:    "bg-teal-600 text-white",
  emerald: "bg-emerald-600 text-white",
  green:   "bg-green-600 text-white",
  lime:    "bg-lime-500 text-zinc-900",
  yellow:  "bg-yellow-500 text-zinc-900",
  amber:   "bg-amber-500 text-zinc-900",
  orange:  "bg-orange-500 text-white",
  rose:    "bg-rose-600 text-white",
  pink:    "bg-pink-600 text-white",
  fuchsia: "bg-fuchsia-600 text-white",
  red:     "bg-red-600 text-white",
  purple:  "bg-purple-600 text-white",
  slate:   "bg-slate-600 text-white",
  zinc:    "bg-zinc-600 text-white",
};

// ── main component ────────────────────────────────────────────────
export default function Tool041FoundSevenPairs() {
  const [topInput, setTopInput]   = useState("");
  const [botInput, setBotInput]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [top, setTop]   = useState("");
  const [bot, setBot]   = useState("");
  const [minHeat, setMinHeat] = useState(1); // show heat >= N

  const isValidTop = /^\d{3}$/.test(topInput);
  const isValidBot = /^\d{2}$/.test(botInput);
  const canSubmit  = isValidTop && isValidBot;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setTop(topInput);
    setBot(botInput);
    setSubmitted(true);
  }

  const result = useMemo(() => {
    if (!submitted || !top || !bot) return null;
    return computeFormulas(top, bot);
  }, [submitted, top, bot]);

  // digit breakdown of inputs
  const H = top ? +top[0] : 0, I = top ? +top[1] : 0, J = top ? +top[2] : 0;
  const K = bot  ? +bot[0]  : 0, L = bot  ? +bot[1]  : 0;

  // dead pair list sorted by heat desc
  const deadPairs = useMemo(() => {
    if (!result) return [];
    return result.heatmap
      .map((v, i) => ({ pair: i, tens: Math.floor(i / 10), units: i % 10, heat: v }))
      .filter(p => p.heat >= minHeat)
      .sort((a, b) => b.heat - a.heat);
  }, [result, minHeat]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/40 rounded-full px-4 py-1 text-xs text-emerald-400 font-medium tracking-wide">
            Found Seven · สูตรคู่ดับ
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            คู่ดับสองตัวล่าง
          </h1>
          <p className="text-zinc-400 text-sm">
            ป้อนผลล่าสุดเพื่อคำนวณคู่ดับสองตัวล่างจาก 6 กลุ่มสูตร
          </p>
        </div>

        {/* ── Input form ────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 3-digit top */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                สามตัวบน (งวดล่าสุด)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                placeholder="เช่น 449"
                value={topInput}
                onChange={e => setTopInput(e.target.value.replace(/\D/g,"").slice(0,3))}
                className={`w-full px-4 py-3 rounded-xl text-2xl font-bold text-center tracking-widest
                  bg-zinc-800 border ${isValidTop || !topInput ? "border-zinc-700" : "border-red-500/70"}
                  text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500
                  transition-colors`}
              />
              {isValidTop && (
                <div className="flex justify-center gap-2 text-xs">
                  <span className="bg-zinc-800 rounded px-2 py-1">ร้อย <b>{topInput[0]}</b></span>
                  <span className="bg-zinc-800 rounded px-2 py-1">สิบ <b>{topInput[1]}</b></span>
                  <span className="bg-zinc-800 rounded px-2 py-1">หน่วย <b>{topInput[2]}</b></span>
                </div>
              )}
            </div>
            {/* 2-digit bot */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                สองตัวล่าง (งวดล่าสุด)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="เช่น 42"
                value={botInput}
                onChange={e => setBotInput(e.target.value.replace(/\D/g,"").slice(0,2))}
                className={`w-full px-4 py-3 rounded-xl text-2xl font-bold text-center tracking-widest
                  bg-zinc-800 border ${isValidBot || !botInput ? "border-zinc-700" : "border-red-500/70"}
                  text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500
                  transition-colors`}
              />
              {isValidBot && (
                <div className="flex justify-center gap-2 text-xs">
                  <span className="bg-zinc-800 rounded px-2 py-1">สิบ <b>{botInput[0]}</b></span>
                  <span className="bg-zinc-800 rounded px-2 py-1">หน่วย <b>{botInput[1]}</b></span>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3 rounded-xl font-bold text-lg tracking-wide transition-all
              ${canSubmit
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"}`}
          >
            คำนวณคู่ดับ →
          </button>
        </form>

        {/* ── Results ─────────────────────────────────────────── */}
        {result && (
          <>
            {/* ── Input summary ── */}
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { label: "ร้อยบน (H)", val: H, col: "text-rose-400" },
                { label: "สิบบน (I)",   val: I, col: "text-orange-400" },
                { label: "หน่วยบน (J)", val: J, col: "text-amber-400" },
                { label: "สิบล่าง (K)", val: K, col: "text-sky-400" },
                { label: "หน่วยล่าง (L)",val: L, col: "text-emerald-400" },
              ].map(d => (
                <div key={d.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-center min-w-[80px]">
                  <div className="text-xs text-zinc-500 mb-1">{d.label}</div>
                  <div className={`text-3xl font-extrabold ${d.col}`}>{d.val}</div>
                </div>
              ))}
            </div>

            {/* ── Formula groups ── */}
            {result.groups.map(group => (
              <div key={group.groupId} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="bg-zinc-800/60 px-5 py-3 border-b border-zinc-800">
                  <h2 className="font-bold text-zinc-200 text-sm tracking-wide">{group.groupName}</h2>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group.formulas.map(f => (
                    <div key={f.id} className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE[f.color] ?? "bg-zinc-700 text-zinc-200"}`}>
                          {f.name}
                        </span>
                        <span className="text-xs text-zinc-500">{f.result}</span>
                      </div>
                      {/* result number big display */}
                      <div className="text-center">
                        <span className="text-2xl font-extrabold tracking-widest text-white font-mono">
                          {f.value}
                        </span>
                      </div>
                      {/* dead digits chips */}
                      <div className="flex flex-wrap gap-1 justify-center">
                        {[...new Set(f.deadDigits)].map((d, i) => (
                          <span key={i} className="bg-red-900/60 border border-red-700/40 text-red-300 text-xs font-bold px-2 py-0.5 rounded-md">
                            {d}
                          </span>
                        ))}
                      </div>
                      {/* desc */}
                      <div className="text-xs text-zinc-500 text-center leading-tight">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ── Heatmap grid ─────────────────────────────────── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="bg-zinc-800/60 px-5 py-3 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-bold text-zinc-200 text-sm tracking-wide">
                  ตาราง 10×10 — ความถี่คู่ดับ (สีเข้ม = ดับแน่นมาก)
                </h2>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  แสดง ≥
                  <select
                    value={minHeat}
                    onChange={e => setMinHeat(+e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-zinc-200"
                  >
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  สูตร
                </div>
              </div>

              <div className="p-4 overflow-x-auto">
                {/* column headers */}
                <div className="grid grid-cols-11 gap-0.5 mb-1 min-w-[360px]">
                  <div className="text-xs text-zinc-600 text-center">สิบ↓/หน่วย→</div>
                  {Array.from({length:10},(_,i)=>(
                    <div key={i} className="text-xs text-zinc-500 text-center font-mono">{i}</div>
                  ))}
                </div>
                {Array.from({length:10},(_,t)=>(
                  <div key={t} className="grid grid-cols-11 gap-0.5 mb-0.5 min-w-[360px]">
                    <div className="text-xs text-zinc-500 text-center py-1.5 font-mono">{t}</div>
                    {Array.from({length:10},(_,u)=>{
                      const heat = result.heatmap[t*10+u];
                      return (
                        <div
                          key={u}
                          title={`คู่ ${t}${u} — ดับ ${heat} สูตร`}
                          className={`text-center py-1 rounded text-xs font-mono tabular-nums
                            ${heat >= minHeat ? heatClass(heat) : "bg-zinc-800/30 text-zinc-700"}`}
                        >
                          {heat >= minHeat ? String(t*10+u).padStart(2,"0") : "·"}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="px-5 pb-4 flex flex-wrap gap-2 items-center text-xs text-zinc-400">
                <span>ระดับ:</span>
                {HEAT.slice(1).map((cls, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded ${cls}`}>≥ {i+1}</span>
                ))}
              </div>
            </div>

            {/* ── Dead pairs ranked list ─────────────────────── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="bg-zinc-800/60 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-bold text-zinc-200 text-sm tracking-wide">
                  คู่ดับที่แนะนำ — เรียงตามความแน่น
                </h2>
                <span className="text-xs text-zinc-500">{deadPairs.length} คู่</span>
              </div>
              <div className="p-4">
                {deadPairs.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">ไม่มีคู่ดับที่ตรงเกณฑ์</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {deadPairs.map(p => (
                      <div
                        key={p.pair}
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl
                          ${heatClass(p.heat)} transition-all`}
                      >
                        <span className="text-lg font-extrabold font-mono leading-none">
                          {String(p.pair).padStart(2,"0")}
                        </span>
                        <span className="text-[10px] opacity-75 leading-none mt-0.5">
                          ×{p.heat}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Formula summary table ─────────────────────── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="bg-zinc-800/60 px-5 py-3 border-b border-zinc-800">
                <h2 className="font-bold text-zinc-200 text-sm tracking-wide">ตารางสรุปสูตรทั้งหมด</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-2 text-zinc-400 font-medium">กลุ่ม</th>
                      <th className="text-left px-4 py-2 text-zinc-400 font-medium">สูตร</th>
                      <th className="text-center px-4 py-2 text-zinc-400 font-medium">ผลลัพธ์</th>
                      <th className="text-center px-4 py-2 text-zinc-400 font-medium">ตัวดับ</th>
                      <th className="text-left px-4 py-2 text-zinc-400 font-medium">สูตรคำนวณ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.groups.flatMap(g =>
                      g.formulas.map((f, fi) => (
                        <tr key={f.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                          {fi === 0 && (
                            <td className="px-4 py-2 text-zinc-400 text-xs align-top" rowSpan={g.formulas.length}>
                              {g.groupName}
                            </td>
                          )}
                          <td className="px-4 py-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE[f.color] ?? "bg-zinc-700 text-zinc-200"}`}>
                              {f.name}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-bold text-white">{f.value}</td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {[...new Set(f.deadDigits)].map((d,i) => (
                                <span key={i} className="bg-red-900/50 text-red-300 text-xs font-bold px-1.5 py-0.5 rounded">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs text-zinc-500">{f.desc}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Footer note ─────────────────────────────────── */}
            <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 text-xs text-amber-400/80 leading-relaxed">
              <strong className="text-amber-400">หมายเหตุ:</strong> ตัวดับแต่ละสูตรคือเลขที่คาดว่าจะ<strong>ไม่ออก</strong>ในงวดถัดไป
              คู่ดับที่แน่น (สีแดง/ส้ม) คือคู่ที่ถูกดับจากหลายสูตรพร้อมกัน ควรหลีกเลี่ยง
              ทุกสูตรอ้างอิงจากไฟล์ "Found Seven.xlsx" ชีต ผล และ คู่ดับหลัก
            </div>
          </>
        )}
      </div>
    </div>
  );
}
