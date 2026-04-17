"use client";
import { useMemo, useState, useCallback } from "react";
import { ToolShell, DataInput } from "@/components/tool-shell";
import { type ParsedEntry, d, mod10, copyText } from "@/lib/data-parser";

/* ═══════════════════════════════════════════════════════════════
   37. MEGA รวมสูตรดับทุกรูปแบบ — 127 สูตรใน 6 หมวด
   ───────────────────────────────────────────
   1) ดับตัวเดียว 25 สูตร    → ตัวเลข 0-9 ที่ไม่มาในล่าง
   2) คู่ดับ 2 ตัวล่าง 12 คู่ → เลข 2 ตัวที่จะไม่มา
   3) ดับแต้ม 30 สูตร        → แต้ม 0-9 ที่ไม่มา
   4) ดับหลักสิบล่าง 30 สูตร → สิบล่างที่ไม่มา
   5) ดับหลักหน่วยล่าง 30 สูตร → หน่วยล่างที่ไม่มา
   6) สรุปรวม                → ฉันทามติข้ามหมวด
   ═══════════════════════════════════════════════════════════════ */

type Fn = (dt: ParsedEntry[], i: number) => number;
interface FDef { name: string; desc: string; fn: Fn }
interface CFml { idx: number; name: string; desc: string; dead: number; pass: number; total: number; pct: number }

function pt(e: ParsedEntry) { return mod10(d(e.bottom, 0) + d(e.bottom, 1)); }
function sTop(e: ParsedEntry) { return d(e.top, 0) + d(e.top, 1) + d(e.top, 2); }
function sBot(e: ParsedEntry) { return d(e.bottom, 0) + d(e.bottom, 1); }

/* ════════════════════════════════════════════════════════════
   SECTION 1: ดับตัวเดียว — 25 สูตร
   ทำนาย 0-9 ที่จะไม่ปรากฏในหลักสิบหรือหน่วยของ 2 ตัวล่าง
   ════════════════════════════════════════════════════════════ */
const SINGLE: FDef[] = [
  /* A — จาก 3 ตัวบน */
  { name: "ผลรวม 3 ตัวบน", desc: "(ร้อย+สิบ+หน่วย) mod 10", fn: (dt, i) => mod10(sTop(dt[i])) },
  { name: "กระจกร้อย", desc: "9 − หลักร้อย", fn: (dt, i) => mod10(9 - d(dt[i].top, 0)) },
  { name: "กระจกสิบบน", desc: "9 − หลักสิบบน", fn: (dt, i) => mod10(9 - d(dt[i].top, 1)) },
  { name: "กระจกหน่วยบน", desc: "9 − หลักหน่วยบน", fn: (dt, i) => mod10(9 - d(dt[i].top, 2)) },
  { name: "ร้อย+หน่วยบน", desc: "(ร้อย + หน่วยบน) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) + d(dt[i].top, 2)) },
  { name: "|ร้อย−สิบ| บน", desc: "|หลักร้อย − หลักสิบ|", fn: (dt, i) => Math.abs(d(dt[i].top, 0) - d(dt[i].top, 1)) },
  { name: "|สิบ−หน่วย| บน", desc: "|หลักสิบ − หลักหน่วย| บน", fn: (dt, i) => Math.abs(d(dt[i].top, 1) - d(dt[i].top, 2)) },
  { name: "ร้อย×หน่วยบน", desc: "(ร้อย × หน่วยบน) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) * d(dt[i].top, 2)) },
  /* B — จาก 2 ตัวล่าง */
  { name: "แต้มล่าง", desc: "(สิบ+หน่วย) ล่าง mod 10", fn: (dt, i) => pt(dt[i]) },
  { name: "กระจกแต้มล่าง", desc: "9 − แต้มล่าง", fn: (dt, i) => mod10(9 - pt(dt[i])) },
  { name: "สิบล่าง×2", desc: "หลักสิบล่าง × 2 mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) * 2) },
  { name: "หน่วยล่าง×2", desc: "หลักหน่วยล่าง × 2 mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 1) * 2) },
  { name: "|สิบ−หน่วย| ล่าง", desc: "|หลักสิบ − หลักหน่วย| ล่าง", fn: (dt, i) => Math.abs(d(dt[i].bottom, 0) - d(dt[i].bottom, 1)) },
  { name: "ผลคูณ 2 ตัวล่าง", desc: "(สิบ × หน่วย) ล่าง mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) * d(dt[i].bottom, 1)) },
  /* C — ข้ามบน-ล่าง */
  { name: "หน่วยบน+หน่วยล่าง", desc: "(หน่วยบน + หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 2) + d(dt[i].bottom, 1)) },
  { name: "สิบบน+สิบล่าง", desc: "(สิบบน + สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 1) + d(dt[i].bottom, 0)) },
  { name: "ร้อย+แต้มล่าง", desc: "(ร้อย + แต้มล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) + pt(dt[i])) },
  { name: "ผลรวม 5 หลัก", desc: "Σ(ร+ส+ห+สL+หL) mod 10", fn: (dt, i) => mod10(sTop(dt[i]) + sBot(dt[i])) },
  { name: "|รวมบน−รวมล่าง|", desc: "|ผลรวม 3 ตัวบน − ผลรวม 2 ตัวล่าง|", fn: (dt, i) => mod10(Math.abs(sTop(dt[i]) - sBot(dt[i]))) },
  { name: "สิบบน×หน่วยล่าง", desc: "(สิบบน × หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 1) * d(dt[i].bottom, 1)) },
  { name: "|ร้อย−หน่วยล่าง|", desc: "|หลักร้อย − หน่วยล่าง|", fn: (dt, i) => Math.abs(d(dt[i].top, 0) - d(dt[i].bottom, 1)) },
  /* D — ใช้ 2+ งวด */
  { name: "ร้อย 2 งวดรวม", desc: "(ร้อยนี้ + ร้อยก่อน) mod 10", fn: (dt, i) => i < 1 ? mod10(d(dt[i].top, 0) * 2) : mod10(d(dt[i].top, 0) + d(dt[i - 1].top, 0)) },
  { name: "หน่วยบน 2 งวดรวม", desc: "(หน่วยนี้ + หน่วยก่อน) mod 10", fn: (dt, i) => i < 1 ? mod10(d(dt[i].top, 2) * 2) : mod10(d(dt[i].top, 2) + d(dt[i - 1].top, 2)) },
  { name: "แต้ม 2 งวดรวม", desc: "(แต้มนี้ + แต้มก่อน) mod 10", fn: (dt, i) => { const p = pt(dt[i]); return i < 1 ? mod10(p * 2) : mod10(p + pt(dt[i - 1])); } },
  { name: "ผลรวมบน×2", desc: "(ร้อย+สิบ+หน่วย) × 2 mod 10", fn: (dt, i) => mod10(sTop(dt[i]) * 2) },
];

/* ════════════════════════════════════════════════════════════
   SECTION 2: คู่ดับ 2 ตัวล่าง — 12 คู่
   จับคู่สูตรตัวเดียว เป็นเลข 2 หลัก (สิบ+หน่วย)
   ════════════════════════════════════════════════════════════ */
interface PairResult { idx: number; name: string; desc: string; tens: number; units: number; pair: string; pass: number; total: number; pct: number }

function buildPairs(): { tensFn: Fn; unitsFn: Fn; name: string; desc: string }[] {
  const pairs: { tensFn: Fn; unitsFn: Fn; name: string; desc: string }[] = [];
  for (let i = 0; i + 1 < SINGLE.length && pairs.length < 12; i += 2) {
    pairs.push({
      tensFn: SINGLE[i].fn,
      unitsFn: SINGLE[i + 1].fn,
      name: `${SINGLE[i].name} | ${SINGLE[i + 1].name}`,
      desc: `สิบ: ${SINGLE[i].name} + หน่วย: ${SINGLE[i + 1].name}`,
    });
  }
  return pairs;
}
const PAIR_DEFS = buildPairs();

/* ════════════════════════════════════════════════════════════
   SECTION 3: ดับแต้ม — 30 สูตร
   ทำนายแต้ม (สิบL + หน่วยL mod 10) ที่จะไม่มา
   ════════════════════════════════════════════════════════════ */
const POINT: FDef[] = [
  { name: "ผลรวมบน", desc: "(ร้อย+สิบ+หน่วย) mod 10", fn: (dt, i) => mod10(sTop(dt[i])) },
  { name: "กระจกแต้ม", desc: "9 − แต้มล่าง", fn: (dt, i) => mod10(9 - pt(dt[i])) },
  { name: "แต้ม×2", desc: "แต้ม × 2 mod 10", fn: (dt, i) => mod10(pt(dt[i]) * 2) },
  { name: "ร้อย+แต้ม", desc: "(ร้อย + แต้ม) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) + pt(dt[i])) },
  { name: "|แต้ม−ร้อย|", desc: "|แต้ม − หลักร้อย|", fn: (dt, i) => Math.abs(pt(dt[i]) - d(dt[i].top, 0)) },
  { name: "แต้ม 2 งวดรวม", desc: "(แต้มนี้ + แต้มก่อน) mod 10", fn: (dt, i) => { if (i < 1) return mod10(pt(dt[i]) * 2); return mod10(pt(dt[i]) + pt(dt[i - 1])); } },
  { name: "ผลต่างแต้ม", desc: "|แต้มนี้ − แต้มก่อน|", fn: (dt, i) => { if (i < 1) return pt(dt[i]); return Math.abs(pt(dt[i]) - pt(dt[i - 1])); } },
  { name: "สิบล่าง+หน่วยบน", desc: "(สิบล่าง + หน่วยบน) mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) + d(dt[i].top, 2)) },
  { name: "หน่วยล่าง+สิบบน", desc: "(หน่วยล่าง + สิบบน) mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 1) + d(dt[i].top, 1)) },
  {
    name: "แต้มถี่ต่ำสุด", desc: "แต้มที่ออกน้อยสุดจากสถิติ",
    fn: (dt, i) => {
      const freq = Array(10).fill(0);
      for (let j = 0; j <= i; j++) freq[pt(dt[j])]++;
      let minF = Infinity, dead = 0;
      for (let k = 0; k < 10; k++) { if (freq[k] < minF) { minF = freq[k]; dead = k; } }
      return dead;
    },
  },
  {
    name: "Gap สูงสุด", desc: "แต้มที่ไม่ออกนานสุด",
    fn: (dt, i) => {
      const lastSeen = Array(10).fill(-1);
      for (let j = 0; j <= i; j++) lastSeen[pt(dt[j])] = j;
      let maxG = -1, dead = 0;
      for (let k = 0; k < 10; k++) { const g = lastSeen[k] === -1 ? i + 1 : i - lastSeen[k]; if (g > maxG) { maxG = g; dead = k; } }
      return dead;
    },
  },
  {
    name: "Diff Chain แต้ม", desc: "ผลต่าง+ความเร่งแต้ม 3 งวด",
    fn: (dt, i) => {
      if (i < 2) return mod10(pt(dt[i]) * 3);
      const p0 = pt(dt[i]), p1 = pt(dt[i - 1]), p2 = pt(dt[i - 2]);
      const d1 = mod10(p0 - p1 + 10), d2 = mod10(p1 - p2 + 10);
      return mod10(p0 + mod10(d1 + mod10(d1 - d2 + 10)));
    },
  },
  { name: "ผลรวม 5 หลัก", desc: "Σ(ร+ส+ห+สL+หL) mod 10", fn: (dt, i) => mod10(sTop(dt[i]) + sBot(dt[i])) },
  { name: "ร้อย×หน่วยล่าง", desc: "(ร้อย × หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) * d(dt[i].bottom, 1)) },
  { name: "|รวมบน−รวมล่าง|", desc: "|ผลรวม 3 ตัวบน − ผลรวม 2 ตัวล่าง| mod 10", fn: (dt, i) => mod10(Math.abs(sTop(dt[i]) - sBot(dt[i]))) },
  { name: "แต้ม×3", desc: "แต้ม × 3 mod 10", fn: (dt, i) => mod10(pt(dt[i]) * 3) },
  { name: "แต้ม²", desc: "แต้ม × แต้ม mod 10", fn: (dt, i) => mod10(pt(dt[i]) ** 2) },
  { name: "สิบบน+หน่วยบน", desc: "(สิบบน + หน่วยบน) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 1) + d(dt[i].top, 2)) },
  { name: "แต้ม+สิบล่าง", desc: "(แต้ม + สิบล่าง) mod 10", fn: (dt, i) => mod10(pt(dt[i]) + d(dt[i].bottom, 0)) },
  { name: "แต้ม+หน่วยล่าง", desc: "(แต้ม + หน่วยล่าง) mod 10", fn: (dt, i) => mod10(pt(dt[i]) + d(dt[i].bottom, 1)) },
  { name: "|แต้ม−สิบบน|", desc: "|แต้ม − หลักสิบบน|", fn: (dt, i) => Math.abs(pt(dt[i]) - d(dt[i].top, 1)) },
  { name: "|แต้ม−หน่วยบน|", desc: "|แต้ม − หลักหน่วยบน|", fn: (dt, i) => Math.abs(pt(dt[i]) - d(dt[i].top, 2)) },
  { name: "แต้ม+สิบบน", desc: "(แต้ม + สิบบน) mod 10", fn: (dt, i) => mod10(pt(dt[i]) + d(dt[i].top, 1)) },
  { name: "แต้ม+หน่วยบน", desc: "(แต้ม + หน่วยบน) mod 10", fn: (dt, i) => mod10(pt(dt[i]) + d(dt[i].top, 2)) },
  {
    name: "แต้ม 3 งวดรวม", desc: "(แต้ม 3 งวดรวม) mod 10",
    fn: (dt, i) => { if (i < 2) return mod10(pt(dt[i]) * 3); return mod10(pt(dt[i]) + pt(dt[i - 1]) + pt(dt[i - 2])); },
  },
  { name: "ร้อย×สิบล่าง", desc: "(ร้อย × สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) * d(dt[i].bottom, 0)) },
  { name: "สิบบน×สิบล่าง", desc: "(สิบบน × สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 1) * d(dt[i].bottom, 0)) },
  { name: "หน่วยบน×หน่วยล่าง", desc: "(หน่วยบน × หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 2) * d(dt[i].bottom, 1)) },
  { name: "|สิบล่าง−หน่วยล่าง|", desc: "|สิบล่าง − หน่วยล่าง|", fn: (dt, i) => Math.abs(d(dt[i].bottom, 0) - d(dt[i].bottom, 1)) },
  { name: "สิบล่าง×หน่วยล่าง", desc: "(สิบล่าง × หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) * d(dt[i].bottom, 1)) },
];

/* ════════════════════════════════════════════════════════════
   SECTION 4: ดับหลักสิบล่าง — 30 สูตร
   ════════════════════════════════════════════════════════════ */
const TENS: FDef[] = [
  {
    name: "Gap-Freq สิบ", desc: "สิบล่างที่หายนาน+ออกน้อย",
    fn: (dt, i) => {
      const freq = Array(10).fill(0);
      const ls = Array(10).fill(-1);
      for (let j = 0; j <= i; j++) { freq[d(dt[j].bottom, 0)]++; ls[d(dt[j].bottom, 0)] = j; }
      const gap = ls.map((l) => (l === -1 ? i + 1 : i - l));
      let best = -Infinity, dead = 0;
      for (let k = 0; k < 10; k++) { const s = gap[k] * 2 + (i + 1 - freq[k]); if (s > best) { best = s; dead = k; } }
      return dead;
    },
  },
  {
    name: "ความเร่ง 3 งวด สิบ", desc: "Diff Chain หลักสิบ 3 งวด",
    fn: (dt, i) => {
      if (i < 2) return mod10(d(dt[i].bottom, 0) * 3);
      const t0 = d(dt[i].bottom, 0), t1 = d(dt[i - 1].bottom, 0), t2 = d(dt[i - 2].bottom, 0);
      const dd1 = mod10(t0 - t1 + 10), dd2 = mod10(t1 - t2 + 10);
      return mod10(t0 + mod10(dd1 + mod10(dd1 - dd2 + 10)));
    },
  },
  { name: "กระจกสิบล่าง", desc: "9 − สิบล่าง", fn: (dt, i) => mod10(9 - d(dt[i].bottom, 0)) },
  { name: "สิบ 2 งวดรวม", desc: "(สิบนี้ + สิบก่อน) mod 10", fn: (dt, i) => i < 1 ? mod10(d(dt[i].bottom, 0) * 2) : mod10(d(dt[i].bottom, 0) + d(dt[i - 1].bottom, 0)) },
  { name: "|สิบ 2 งวดต่าง|", desc: "|สิบนี้ − สิบก่อน|", fn: (dt, i) => i < 1 ? d(dt[i].bottom, 0) : Math.abs(d(dt[i].bottom, 0) - d(dt[i - 1].bottom, 0)) },
  { name: "ร้อย+สิบล่าง", desc: "(ร้อย + สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) + d(dt[i].bottom, 0)) },
  { name: "สิบบน+สิบล่าง", desc: "(สิบบน + สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 1) + d(dt[i].bottom, 0)) },
  { name: "หน่วยบน+สิบล่าง", desc: "(หน่วยบน + สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 2) + d(dt[i].bottom, 0)) },
  { name: "สิบ×หน่วยล่าง", desc: "(สิบล่าง × หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) * d(dt[i].bottom, 1)) },
  { name: "ผลรวมบน ดับสิบ", desc: "(ร้อย+สิบ+หน่วย) mod 10", fn: (dt, i) => mod10(sTop(dt[i])) },
  { name: "สิบล่าง×2", desc: "สิบล่าง × 2 mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) * 2) },
  { name: "สิบล่าง×3", desc: "สิบล่าง × 3 mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) * 3) },
  { name: "สิบล่าง²", desc: "สิบล่าง × สิบล่าง mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) ** 2) },
  { name: "|ร้อย−สิบล่าง|", desc: "|ร้อย − สิบล่าง|", fn: (dt, i) => Math.abs(d(dt[i].top, 0) - d(dt[i].bottom, 0)) },
  { name: "|สิบบน−สิบล่าง|", desc: "|สิบบน − สิบล่าง|", fn: (dt, i) => Math.abs(d(dt[i].top, 1) - d(dt[i].bottom, 0)) },
  { name: "|หน่วยบน−สิบล่าง|", desc: "|หน่วยบน − สิบล่าง|", fn: (dt, i) => Math.abs(d(dt[i].top, 2) - d(dt[i].bottom, 0)) },
  { name: "ร้อย×สิบล่าง", desc: "(ร้อย × สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) * d(dt[i].bottom, 0)) },
  { name: "สิบบน×สิบล่าง", desc: "(สิบบน × สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 1) * d(dt[i].bottom, 0)) },
  { name: "หน่วยบน×สิบล่าง", desc: "(หน่วยบน × สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 2) * d(dt[i].bottom, 0)) },
  { name: "สิบ+แต้ม", desc: "(สิบล่าง + แต้ม) mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) + pt(dt[i])) },
  { name: "|สิบล่าง−แต้ม|", desc: "|สิบล่าง − แต้ม|", fn: (dt, i) => Math.abs(d(dt[i].bottom, 0) - pt(dt[i])) },
  {
    name: "สิบ 3 งวดรวม", desc: "(สิบ 3 งวดรวม) mod 10",
    fn: (dt, i) => { if (i < 2) return mod10(d(dt[i].bottom, 0) * 3); return mod10(d(dt[i].bottom, 0) + d(dt[i - 1].bottom, 0) + d(dt[i - 2].bottom, 0)); },
  },
  {
    name: "Follow Freq สิบ", desc: "ตามสิบปัจจุบัน ตัวถัดไปน้อยสุด",
    fn: (dt, i) => {
      const t = d(dt[i].bottom, 0);
      const ff = Array(10).fill(0);
      for (let j = 0; j < i; j++) { if (d(dt[j].bottom, 0) === t) ff[d(dt[j + 1].bottom, 0)]++; }
      let minF = Infinity, dead = 0;
      for (let k = 0; k < 10; k++) { if (ff[k] < minF) { minF = ff[k]; dead = k; } }
      return dead;
    },
  },
  {
    name: "Z-score สิบ", desc: "สิบล่างที่ z-score ต่ำสุด",
    fn: (dt, i) => {
      const freq = Array(10).fill(0);
      for (let j = 0; j <= i; j++) freq[d(dt[j].bottom, 0)]++;
      const mean = freq.reduce((a, b) => a + b, 0) / 10;
      const std = Math.sqrt(freq.reduce((s, f) => s + (f - mean) ** 2, 0) / 10) || 1;
      let minZ = Infinity, dead = 0;
      for (let k = 0; k < 10; k++) { const z = (freq[k] - mean) / std; if (z < minZ) { minZ = z; dead = k; } }
      return dead;
    },
  },
  { name: "|สิบล่าง−หน่วยล่าง|", desc: "|สิบล่าง − หน่วยล่าง|", fn: (dt, i) => Math.abs(d(dt[i].bottom, 0) - d(dt[i].bottom, 1)) },
  { name: "สิบล่าง×แต้ม", desc: "(สิบล่าง × แต้ม) mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) * pt(dt[i])) },
  { name: "(ร้อย+สิบบน+สิบล่าง)", desc: "(ร้อย + สิบบน + สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) + d(dt[i].top, 1) + d(dt[i].bottom, 0)) },
  { name: "(สิบบน+หน่วยบน+สิบล่าง)", desc: "(สิบบน + หน่วยบน + สิบล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 1) + d(dt[i].top, 2) + d(dt[i].bottom, 0)) },
  { name: "กระจกสิบ+ร้อย", desc: "(9 − สิบล่าง + ร้อย) mod 10", fn: (dt, i) => mod10(9 - d(dt[i].bottom, 0) + d(dt[i].top, 0)) },
  {
    name: "ผลต่างสิบ 3 งวด", desc: "ความเร่งผลต่างสิบ 3 งวด",
    fn: (dt, i) => {
      if (i < 2) return mod10(d(dt[i].bottom, 0) * 3);
      const t0 = d(dt[i].bottom, 0), t1 = d(dt[i - 1].bottom, 0), t2 = d(dt[i - 2].bottom, 0);
      return mod10(Math.abs(Math.abs(t0 - t1) - Math.abs(t1 - t2)));
    },
  },
];

/* ════════════════════════════════════════════════════════════
   SECTION 5: ดับหลักหน่วยล่าง — 30 สูตร
   ════════════════════════════════════════════════════════════ */
const UNITS: FDef[] = [
  {
    name: "Z-score หน่วย", desc: "หน่วยล่างที่ z-score ต่ำสุด",
    fn: (dt, i) => {
      const freq = Array(10).fill(0);
      for (let j = 0; j <= i; j++) freq[d(dt[j].bottom, 1)]++;
      const mean = freq.reduce((a, b) => a + b, 0) / 10;
      const std = Math.sqrt(freq.reduce((s, f) => s + (f - mean) ** 2, 0) / 10) || 1;
      let minZ = Infinity, dead = 0;
      for (let k = 0; k < 10; k++) { const z = (freq[k] - mean) / std; if (z < minZ) { minZ = z; dead = k; } }
      return dead;
    },
  },
  {
    name: "Follow Freq หน่วย", desc: "ตามหน่วยปัจจุบัน ตัวถัดไปน้อยสุด",
    fn: (dt, i) => {
      const u = d(dt[i].bottom, 1);
      const ff = Array(10).fill(0);
      for (let j = 0; j < i; j++) { if (d(dt[j].bottom, 1) === u) ff[d(dt[j + 1].bottom, 1)]++; }
      let minF = Infinity, dead = 0;
      for (let k = 0; k < 10; k++) { if (ff[k] < minF) { minF = ff[k]; dead = k; } }
      return dead;
    },
  },
  { name: "กระจกหน่วยล่าง", desc: "9 − หน่วยล่าง", fn: (dt, i) => mod10(9 - d(dt[i].bottom, 1)) },
  { name: "หน่วย 2 งวดรวม", desc: "(หน่วยนี้ + หน่วยก่อน) mod 10", fn: (dt, i) => i < 1 ? mod10(d(dt[i].bottom, 1) * 2) : mod10(d(dt[i].bottom, 1) + d(dt[i - 1].bottom, 1)) },
  { name: "|หน่วย 2 งวดต่าง|", desc: "|หน่วยนี้ − หน่วยก่อน|", fn: (dt, i) => i < 1 ? d(dt[i].bottom, 1) : Math.abs(d(dt[i].bottom, 1) - d(dt[i - 1].bottom, 1)) },
  { name: "ร้อย+หน่วยล่าง", desc: "(ร้อย + หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) + d(dt[i].bottom, 1)) },
  { name: "หน่วยบน+หน่วยล่าง", desc: "(หน่วยบน + หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 2) + d(dt[i].bottom, 1)) },
  { name: "สิบล่าง+หน่วยล่าง", desc: "(สิบ + หน่วย) ล่าง mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) + d(dt[i].bottom, 1)) },
  { name: "สิบบน×หน่วยล่าง", desc: "(สิบบน × หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 1) * d(dt[i].bottom, 1)) },
  { name: "|ร้อย−หน่วยล่าง|", desc: "|ร้อย − หน่วยล่าง|", fn: (dt, i) => Math.abs(d(dt[i].top, 0) - d(dt[i].bottom, 1)) },
  { name: "หน่วยล่าง×2", desc: "หน่วยล่าง × 2 mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 1) * 2) },
  { name: "หน่วยล่าง×3", desc: "หน่วยล่าง × 3 mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 1) * 3) },
  { name: "หน่วยล่าง²", desc: "หน่วยล่าง × หน่วยล่าง mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 1) ** 2) },
  { name: "|สิบบน−หน่วยล่าง|", desc: "|สิบบน − หน่วยล่าง|", fn: (dt, i) => Math.abs(d(dt[i].top, 1) - d(dt[i].bottom, 1)) },
  { name: "|หน่วยบน−หน่วยล่าง|", desc: "|หน่วยบน − หน่วยล่าง|", fn: (dt, i) => Math.abs(d(dt[i].top, 2) - d(dt[i].bottom, 1)) },
  { name: "ร้อย×หน่วยล่าง", desc: "(ร้อย × หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) * d(dt[i].bottom, 1)) },
  { name: "หน่วยบน×หน่วยล่าง", desc: "(หน่วยบน × หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 2) * d(dt[i].bottom, 1)) },
  { name: "หน่วย+แต้ม", desc: "(หน่วยล่าง + แต้ม) mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 1) + pt(dt[i])) },
  { name: "|หน่วยล่าง−แต้ม|", desc: "|หน่วยล่าง − แต้ม|", fn: (dt, i) => Math.abs(d(dt[i].bottom, 1) - pt(dt[i])) },
  {
    name: "หน่วย 3 งวดรวม", desc: "(หน่วย 3 งวดรวม) mod 10",
    fn: (dt, i) => { if (i < 2) return mod10(d(dt[i].bottom, 1) * 3); return mod10(d(dt[i].bottom, 1) + d(dt[i - 1].bottom, 1) + d(dt[i - 2].bottom, 1)); },
  },
  { name: "|สิบล่าง−หน่วยล่าง|", desc: "|สิบล่าง − หน่วยล่าง|", fn: (dt, i) => Math.abs(d(dt[i].bottom, 0) - d(dt[i].bottom, 1)) },
  { name: "สิบล่าง×หน่วยล่าง", desc: "(สิบล่าง × หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 0) * d(dt[i].bottom, 1)) },
  { name: "(ร้อย+สิบบน+หน่วยล่าง)", desc: "(ร้อย + สิบบน + หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 0) + d(dt[i].top, 1) + d(dt[i].bottom, 1)) },
  { name: "(สิบบน+หน่วยบน+หน่วยล่าง)", desc: "(สิบบน + หน่วยบน + หน่วยล่าง) mod 10", fn: (dt, i) => mod10(d(dt[i].top, 1) + d(dt[i].top, 2) + d(dt[i].bottom, 1)) },
  { name: "หน่วยล่าง×แต้ม", desc: "(หน่วยล่าง × แต้ม) mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 1) * pt(dt[i])) },
  { name: "กระจกหน่วย+ร้อย", desc: "(9 − หน่วยล่าง + ร้อย) mod 10", fn: (dt, i) => mod10(9 - d(dt[i].bottom, 1) + d(dt[i].top, 0)) },
  {
    name: "Gap สูงสุดหน่วย", desc: "หน่วยล่างที่ไม่ออกนานสุด",
    fn: (dt, i) => {
      const lastSeen = Array(10).fill(-1);
      for (let j = 0; j <= i; j++) lastSeen[d(dt[j].bottom, 1)] = j;
      let maxG = -1, dead = 0;
      for (let k = 0; k < 10; k++) { const g = lastSeen[k] === -1 ? i + 1 : i - lastSeen[k]; if (g > maxG) { maxG = g; dead = k; } }
      return dead;
    },
  },
  { name: "(หน่วยล่าง+ผลรวมบน)", desc: "(หน่วยล่าง + ผลรวมบน) mod 10", fn: (dt, i) => mod10(d(dt[i].bottom, 1) + sTop(dt[i])) },
  {
    name: "ผลต่างหน่วย 3 งวด", desc: "ความเร่งผลต่างหน่วย 3 งวด",
    fn: (dt, i) => {
      if (i < 2) return mod10(d(dt[i].bottom, 1) * 3);
      const u0 = d(dt[i].bottom, 1), u1 = d(dt[i - 1].bottom, 1), u2 = d(dt[i - 2].bottom, 1);
      return mod10(Math.abs(Math.abs(u0 - u1) - Math.abs(u1 - u2)));
    },
  },
  {
    name: "ถี่ต่ำสุดหน่วย", desc: "หน่วยที่ออกน้อยสุดจากสถิติ",
    fn: (dt, i) => {
      const freq = Array(10).fill(0);
      for (let j = 0; j <= i; j++) freq[d(dt[j].bottom, 1)]++;
      let minF = Infinity, dead = 0;
      for (let k = 0; k < 10; k++) { if (freq[k] < minF) { minF = freq[k]; dead = k; } }
      return dead;
    },
  },
];

/* ════════════════════════════════════════════════════════════
   COMPUTE FUNCTIONS
   ════════════════════════════════════════════════════════════ */

/* === Single Dead === */
type VerifyFn = (predicted: number, next: ParsedEntry) => boolean;

function computeCategory(
  data: ParsedEntry[],
  formulas: FDef[],
  verify: VerifyFn,
): { formulas: CFml[]; consensus: { digit: number; count: number }[]; avgPct: number; allDeadText: string } | null {
  if (data.length < 5) return null;
  const n = data.length;

  const results: CFml[] = formulas.map((f, idx) => {
    const dead = f.fn(data, n - 1);
    let pass = 0, total = 0;
    for (let i = 1; i < n - 1; i++) {
      const pred = f.fn(data, i);
      total++;
      if (verify(pred, data[i + 1])) pass++;
    }
    return { idx: idx + 1, name: f.name, desc: f.desc, dead, pass, total, pct: total > 0 ? (pass / total) * 100 : 0 };
  });

  const digitCount = Array(10).fill(0) as number[];
  results.forEach((r) => digitCount[r.dead]++);
  const consensus = digitCount
    .map((c, dg) => ({ digit: dg, count: c }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const avgPct = results.reduce((s, f) => s + f.pct, 0) / results.length;
  const allDeadText = results.map((r) => r.dead).join(" ");

  return { formulas: results, consensus, avgPct, allDeadText };
}

/* === Pair Dead === */
function computePairs(data: ParsedEntry[]): { pairs: PairResult[]; allPairText: string; avgPct: number } | null {
  if (data.length < 5) return null;
  const n = data.length;

  const pairs: PairResult[] = PAIR_DEFS.map((p, idx) => {
    const tens = p.tensFn(data, n - 1);
    const units = p.unitsFn(data, n - 1);
    const pair = `${tens}${units}`;
    let pass = 0, total = 0;
    for (let i = 1; i < n - 1; i++) {
      const t = p.tensFn(data, i);
      const u = p.unitsFn(data, i);
      total++;
      if (`${t}${u}` !== data[i + 1].bottom) pass++;
    }
    return { idx: idx + 1, name: p.name, desc: p.desc, tens, units, pair, pass, total, pct: total > 0 ? (pass / total) * 100 : 0 };
  });

  const allPairText = pairs.map((p) => p.pair).join(" ");
  const avgPct = pairs.reduce((s, p) => s + p.pct, 0) / pairs.length;
  return { pairs, allPairText, avgPct };
}

/* ════════════════════════════════════════════════════════════
   COLOR HELPERS
   ════════════════════════════════════════════════════════════ */
function tier(pct: number) {
  if (pct >= 86) return { text: "text-emerald-600", bg: "bg-emerald-500", border: "border-emerald-300", badge: "bg-emerald-100 text-emerald-700", from: "from-emerald-50" };
  if (pct >= 82) return { text: "text-blue-600", bg: "bg-blue-500", border: "border-blue-300", badge: "bg-blue-100 text-blue-700", from: "from-blue-50" };
  if (pct >= 78) return { text: "text-amber-600", bg: "bg-amber-500", border: "border-amber-300", badge: "bg-amber-100 text-amber-700", from: "from-amber-50" };
  return { text: "text-red-500", bg: "bg-red-500", border: "border-red-300", badge: "bg-red-100 text-red-700", from: "from-red-50" };
}
function pairTier(pct: number) {
  if (pct >= 97) return tier(90);
  if (pct >= 95) return tier(85);
  if (pct >= 93) return tier(80);
  return tier(70);
}

/* ════════════════════════════════════════════════════════════
   TAB DEFINITIONS
   ════════════════════════════════════════════════════════════ */
const TABS = [
  { key: "summary", label: "📊 สรุปรวม", shortLabel: "สรุป" },
  { key: "single", label: "🔢 ดับตัวเดียว", shortLabel: "ตัวเดียว" },
  { key: "pair", label: "🎯 คู่ดับล่าง", shortLabel: "คู่ดับ" },
  { key: "point", label: "⚡ ดับแต้ม", shortLabel: "แต้ม" },
  { key: "tens", label: "🔟 ดับหลักสิบ", shortLabel: "สิบ" },
  { key: "units", label: "1️⃣ ดับหลักหน่วย", shortLabel: "หน่วย" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/* ════════════════════════════════════════════════════════════
   SECTION RENDERER — Shared UI for single-digit categories
   ════════════════════════════════════════════════════════════ */
function SingleSection({
  result,
  label,
  gradient,
  showToast,
}: {
  result: { formulas: CFml[]; consensus: { digit: number; count: number }[]; avgPct: number; allDeadText: string };
  label: string;
  gradient: string;
  showToast: (msg: string) => void;
}) {
  const sorted = useMemo(() => [...result.formulas].sort((a, b) => b.pct - a.pct), [result.formulas]);

  return (
    <div className="space-y-4">
      {/* Consensus */}
      <div className={`rounded-2xl ${gradient} p-4 text-white shadow-lg`}>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider opacity-80">
          🎯 ฉันทามติ {label}
        </div>
        <div className="flex flex-wrap gap-3">
          {result.consensus.map((c) => (
            <div key={c.digit} className="flex items-center gap-1.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl font-black backdrop-blur-sm">{c.digit}</span>
              <span className="text-sm font-bold opacity-90">×{c.count}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[11px] opacity-70">
          ความแม่นเฉลี่ย {result.avgPct.toFixed(1)}% | {result.formulas.length} สูตร | {result.formulas[0]?.total || 0} งวด
        </div>
      </div>

      {/* Formula Cards */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {result.formulas.map((f) => {
          const c = tier(f.pct);
          return (
            <div key={f.idx} className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.from} to-white p-2.5 shadow-sm`}>
              <div className={`absolute -top-0.5 -left-0.5 rounded-br-lg ${c.badge} px-1.5 py-0.5 text-[9px] font-bold`}>#{f.idx}</div>
              <div className="mt-3 text-[10px] font-bold leading-tight text-ink/70 line-clamp-1">{f.name}</div>
              <div className={`my-1.5 text-center text-3xl font-black ${c.text}`}>{f.dead}</div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200/60">
                <div className={`h-full rounded-full ${c.bg}`} style={{ width: `${Math.min(f.pct, 100)}%` }} />
              </div>
              <div className={`mt-0.5 text-right text-[10px] font-bold ${c.text}`}>{f.pct.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>

      {/* Copy */}
      <button
        onClick={() => { copyText(result.allDeadText); showToast("คัดลอก: " + result.allDeadText); }}
        className={`w-full rounded-xl ${gradient} py-2.5 text-center text-sm font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]`}
      >
        📋 คัดลอก {label} ทั้ง {result.formulas.length} สูตร
      </button>

      {/* Ranking Table */}
      <details className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-bold text-ink/70 hover:bg-gray-50">
          📊 อันดับความแม่นยำ
        </summary>
        <div className="overflow-x-auto border-t border-ink/10">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="px-2 py-1.5 text-left">#</th>
                <th className="px-2 py-1.5 text-left">สูตร</th>
                <th className="px-2 py-1.5 text-center">ดับ</th>
                <th className="px-2 py-1.5 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f, rank) => {
                const c = tier(f.pct);
                return (
                  <tr key={f.idx} className="border-t border-ink/5">
                    <td className="px-2 py-1 text-ink/40">{rank + 1}</td>
                    <td className="px-2 py-1">
                      <span className="font-medium text-ink/80">{f.name}</span>
                      <div className="text-[9px] text-ink/40">{f.desc}</div>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${c.badge} text-xs font-black`}>{f.dead}</span>
                    </td>
                    <td className={`px-2 py-1 text-right font-bold ${c.text}`}>{f.pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PAIR SECTION RENDERER
   ════════════════════════════════════════════════════════════ */
function PairSection({ result, showToast }: { result: { pairs: PairResult[]; allPairText: string; avgPct: number }; showToast: (msg: string) => void }) {
  const sorted = useMemo(() => [...result.pairs].sort((a, b) => b.pct - a.pct), [result.pairs]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 p-4 text-white shadow-lg">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider opacity-80">🎯 คู่ดับ 2 ตัวล่าง {result.pairs.length} คู่</div>
        <div className="flex flex-wrap gap-3">
          {result.pairs.map((p) => (
            <span key={p.idx} className="inline-flex h-10 items-center justify-center rounded-full bg-white/20 px-3 text-xl font-black backdrop-blur-sm">{p.pair}</span>
          ))}
        </div>
        <div className="mt-2 text-[11px] opacity-70">ความแม่นเฉลี่ย {result.avgPct.toFixed(1)}%</div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {result.pairs.map((p) => {
          const c = pairTier(p.pct);
          return (
            <div key={p.idx} className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.from} to-white p-3 shadow-sm`}>
              <div className={`absolute -top-0.5 -left-0.5 rounded-br-lg ${c.badge} px-1.5 py-0.5 text-[9px] font-bold`}>คู่ {p.idx}</div>
              <div className={`mt-3 text-center text-4xl font-black ${c.text}`}>{p.pair}</div>
              <div className="mt-1 text-[9px] leading-tight text-ink/40 line-clamp-2">{p.desc}</div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200/60">
                <div className={`h-full rounded-full ${c.bg}`} style={{ width: `${Math.min(p.pct, 100)}%` }} />
              </div>
              <div className={`mt-0.5 text-right text-[10px] font-bold ${c.text}`}>{p.pct.toFixed(1)}% ({p.pass}/{p.total})</div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => { copyText(result.allPairText); showToast("คัดลอก: " + result.allPairText); }}
        className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-2.5 text-center text-sm font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
      >
        📋 คัดลอกคู่ดับทั้ง {result.pairs.length} คู่
      </button>

      <details className="rounded-2xl border border-ink/10 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-bold text-ink/70 hover:bg-gray-50">📊 อันดับความแม่นยำ</summary>
        <div className="overflow-x-auto border-t border-ink/10">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 text-ink/50">
                <th className="px-2 py-1.5 text-left">#</th>
                <th className="px-2 py-1.5 text-left">คู่สูตร</th>
                <th className="px-2 py-1.5 text-center">ดับ</th>
                <th className="px-2 py-1.5 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, rank) => {
                const c = pairTier(p.pct);
                return (
                  <tr key={p.idx} className="border-t border-ink/5">
                    <td className="px-2 py-1 text-ink/40">{rank + 1}</td>
                    <td className="px-2 py-1 text-[10px]">{p.name}</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`inline-flex h-6 items-center rounded-full ${c.badge} px-2 text-xs font-black`}>{p.pair}</span>
                    </td>
                    <td className={`px-2 py-1 text-right font-bold ${c.text}`}>{p.pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SUMMARY SECTION — Cross-category consensus
   ════════════════════════════════════════════════════════════ */
interface SummaryData {
  singleResult: ReturnType<typeof computeCategory>;
  pairResult: ReturnType<typeof computePairs>;
  pointResult: ReturnType<typeof computeCategory>;
  tensResult: ReturnType<typeof computeCategory>;
  unitsResult: ReturnType<typeof computeCategory>;
}

function SummarySection({ data, showToast }: { data: SummaryData; showToast: (msg: string) => void }) {
  const categories = [
    { label: "ดับตัวเดียว", count: 25, gradient: "from-indigo-500 to-purple-600", result: data.singleResult },
    { label: "ดับแต้ม", count: 30, gradient: "from-violet-500 to-fuchsia-600", result: data.pointResult },
    { label: "ดับหลักสิบล่าง", count: 30, gradient: "from-blue-500 to-cyan-600", result: data.tensResult },
    { label: "ดับหลักหน่วยล่าง", count: 30, gradient: "from-teal-500 to-emerald-600", result: data.unitsResult },
  ];

  /* mega consensus: digits that appear across multiple categories */
  const megaCount = Array(10).fill(0);
  const megaDetails: Record<number, string[]> = {};
  for (let i = 0; i < 10; i++) megaDetails[i] = [];

  categories.forEach((cat) => {
    if (!cat.result) return;
    const top = cat.result.consensus[0];
    if (top) {
      megaCount[top.digit] += top.count;
      megaDetails[top.digit].push(`${cat.label} (×${top.count})`);
    }
  });

  const megaRanking = megaCount
    .map((count, digit) => ({ digit, count, sources: megaDetails[digit] }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const allText = megaRanking.map((m) => `${m.digit}(${m.count})`).join(" ");

  return (
    <div className="space-y-4">
      {/* Mega Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-black p-5 text-white shadow-2xl">
        <h2 className="mb-1 text-lg font-black tracking-tight">🏆 MEGA สรุปรวมสูตรดับทุกรูปแบบ</h2>
        <p className="text-xs opacity-60">127 สูตรจาก 5 หมวด — วิเคราะห์ข้ามหมวดหาเลขดับแม่นที่สุด</p>
      </div>

      {/* Cross-category Consensus */}
      <div className="rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-4 text-white shadow-lg">
        <div className="mb-2 text-sm font-black uppercase tracking-wider">⭐ ฉันทามติข้ามหมวด — เลขดับยอดนิยม</div>
        <div className="flex flex-wrap gap-3">
          {megaRanking.slice(0, 5).map((m) => (
            <div key={m.digit} className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/30 text-3xl font-black">{m.digit}</span>
              <div>
                <div className="text-sm font-black">×{m.count} สูตร</div>
                <div className="text-[9px] opacity-70">{m.sources.join(", ")}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => { copyText(allText); showToast("คัดลอก: " + allText); }}
          className="mt-3 rounded-lg bg-white/20 px-4 py-1.5 text-xs font-bold backdrop-blur-sm transition hover:bg-white/30"
        >
          📋 คัดลอกสรุป
        </button>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          if (!cat.result) return null;
          const top3 = cat.result.consensus.slice(0, 3);
          return (
            <div key={cat.label} className={`rounded-xl bg-gradient-to-br ${cat.gradient} p-4 text-white shadow-md`}>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80">{cat.label}</div>
              <div className="text-[10px] opacity-60">{cat.count} สูตร | เฉลี่ย {cat.result.avgPct.toFixed(1)}%</div>
              <div className="mt-2 flex gap-2">
                {top3.map((c) => (
                  <div key={c.digit} className="flex items-center gap-1">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-xl font-black">{c.digit}</span>
                    <span className="text-[10px] font-bold opacity-80">×{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {/* Pair card */}
        {data.pairResult && (
          <div className="rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 p-4 text-white shadow-md">
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">คู่ดับ 2 ตัวล่าง</div>
            <div className="text-[10px] opacity-60">{data.pairResult.pairs.length} คู่ | เฉลี่ย {data.pairResult.avgPct.toFixed(1)}%</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.pairResult.pairs.slice(0, 6).map((p) => (
                <span key={p.idx} className="inline-flex h-8 items-center rounded-full bg-white/25 px-2.5 text-sm font-black">{p.pair}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All Dead Numbers Quick Reference */}
      <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-ink/70">📝 สรุปเลขดับทุกหมวด (คัดลอกได้)</h3>
        <div className="space-y-2 text-xs">
          {categories.map((cat) => {
            if (!cat.result) return null;
            return (
              <div key={cat.label} className="flex items-start gap-2">
                <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-ink/50">{cat.label}</span>
                <span className="font-mono text-ink/80">{cat.result.allDeadText}</span>
                <button
                  onClick={() => { copyText(cat.result!.allDeadText); showToast(`คัดลอก ${cat.label}`); }}
                  className="shrink-0 text-[10px] text-blue-500 hover:text-blue-700"
                >
                  📋
                </button>
              </div>
            );
          })}
          {data.pairResult && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-ink/50">คู่ดับ</span>
              <span className="font-mono text-ink/80">{data.pairResult.allPairText}</span>
              <button
                onClick={() => { copyText(data.pairResult!.allPairText); showToast("คัดลอกคู่ดับ"); }}
                className="shrink-0 text-[10px] text-blue-500 hover:text-blue-700"
              >
                📋
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Digit Heatmap — how many times each 0-9 appears as dead across all formulas */}
      <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-ink/70">🔥 Heatmap — ความถี่เลขดับรวมทุกสูตร (0-9)</h3>
        <HeatmapRow categories={categories} />
      </div>
    </div>
  );
}

/* Heatmap sub-component */
function HeatmapRow({ categories }: { categories: { label: string; result: ReturnType<typeof computeCategory> }[] }) {
  const totalCount = useMemo(() => {
    const cnt = Array(10).fill(0);
    categories.forEach((cat) => {
      if (!cat.result) return;
      cat.result.formulas.forEach((f) => cnt[f.dead]++);
    });
    return cnt;
  }, [categories]);

  const maxC = Math.max(...totalCount, 1);

  return (
    <div className="grid grid-cols-10 gap-1.5">
      {totalCount.map((cnt, digit) => {
        const intensity = cnt / maxC;
        const bg = intensity > 0.7 ? "bg-red-500 text-white" : intensity > 0.4 ? "bg-orange-400 text-white" : intensity > 0.15 ? "bg-yellow-300 text-ink" : "bg-gray-100 text-ink/40";
        return (
          <div key={digit} className={`flex flex-col items-center rounded-lg py-2 ${bg} transition-all`}>
            <span className="text-lg font-black">{digit}</span>
            <span className="text-[10px] font-bold opacity-80">×{cnt}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function Tool037MegaDead() {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  return (
    <ToolShell title="MEGA รวมสูตรดับทุกรูปแบบ" desc="127 สูตรดับใน 6 หมวด — วิเคราะห์ครบทุกมุม" minEntries={5}>
      {({ data, localInput, setLocalInput, showToast }) => (
        <div className="space-y-4">
          <DataInput value={localInput} onChange={setLocalInput} />

          {/* Tab Bar */}
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${
                  activeTab === tab.key
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink/40 hover:text-ink/70"
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {data.length >= 5 && (
            <TabContent data={data} activeTab={activeTab} showToast={showToast} />
          )}

          {data.length > 0 && data.length < 5 && (
            <div className="rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700">
              ต้องการข้อมูลอย่างน้อย 5 งวด (ตอนนี้มี {data.length} งวด)
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}

/* Tab content that can use hooks */
function TabContent({ data, activeTab, showToast }: { data: ParsedEntry[]; activeTab: TabKey; showToast: (msg: string) => void }) {
  const singleResult = useMemo(() => computeCategory(data, SINGLE, (pred, next) => pred !== d(next.bottom, 0) && pred !== d(next.bottom, 1)), [data]);
  const pairResult = useMemo(() => computePairs(data), [data]);
  const pointResult = useMemo(() => computeCategory(data, POINT, (pred, next) => pred !== pt(next)), [data]);
  const tensResult = useMemo(() => computeCategory(data, TENS, (pred, next) => pred !== d(next.bottom, 0)), [data]);
  const unitsResult = useMemo(() => computeCategory(data, UNITS, (pred, next) => pred !== d(next.bottom, 1)), [data]);
  const showToastCb = useCallback(showToast, [showToast]);

  switch (activeTab) {
    case "summary":
      return <SummarySection data={{ singleResult, pairResult, pointResult, tensResult, unitsResult }} showToast={showToastCb} />;
    case "single":
      return singleResult ? <SingleSection result={singleResult} label="ดับตัวเดียว" gradient="bg-gradient-to-r from-indigo-500 to-purple-600" showToast={showToastCb} /> : null;
    case "pair":
      return pairResult ? <PairSection result={pairResult} showToast={showToastCb} /> : null;
    case "point":
      return pointResult ? <SingleSection result={pointResult} label="ดับแต้ม" gradient="bg-gradient-to-r from-violet-500 to-fuchsia-600" showToast={showToastCb} /> : null;
    case "tens":
      return tensResult ? <SingleSection result={tensResult} label="ดับหลักสิบล่าง" gradient="bg-gradient-to-r from-blue-500 to-cyan-600" showToast={showToastCb} /> : null;
    case "units":
      return unitsResult ? <SingleSection result={unitsResult} label="ดับหลักหน่วยล่าง" gradient="bg-gradient-to-r from-teal-500 to-emerald-600" showToast={showToastCb} /> : null;
    default:
      return null;
  }
}
