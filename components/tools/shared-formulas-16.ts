import { type ParsedEntry, d, mod10 } from "@/lib/data-parser";

/**
 * Shared 16 single-dead formulas used by tool-032, tool-033, tool-034.
 * Each formula predicts a single digit (0-9) that should NOT appear
 * in the next draw's bottom 2 digits.
 */

export type SingleDeadFn = (dt: ParsedEntry[], i: number) => number;

export interface FormulaDef {
  id: number;
  name: string;
  desc: string;
  fn: SingleDeadFn;
}

export const FORMULAS_16: FormulaDef[] = [
  /* ─── กลุ่ม A: คำนวณจากสามตัวบน ─── */
  {
    id: 1,
    name: "ผลรวม 3 ตัวบน",
    desc: "(ร้อย+สิบ+หน่วย) mod 10",
    fn: (dt, i) =>
      mod10(d(dt[i].top, 0) + d(dt[i].top, 1) + d(dt[i].top, 2)),
  },
  {
    id: 2,
    name: "กระจกหลักร้อย",
    desc: "9 − หลักร้อย",
    fn: (dt, i) => mod10(9 - d(dt[i].top, 0)),
  },
  {
    id: 3,
    name: "ร้อย+หน่วย บน",
    desc: "(ร้อย + หน่วยบน) mod 10",
    fn: (dt, i) => mod10(d(dt[i].top, 0) + d(dt[i].top, 2)),
  },
  {
    id: 4,
    name: "|ร้อย−สิบ| บน",
    desc: "|หลักร้อย − หลักสิบ|",
    fn: (dt, i) => Math.abs(d(dt[i].top, 0) - d(dt[i].top, 1)),
  },

  /* ─── กลุ่ม B: คำนวณจากสองตัวล่าง ─── */
  {
    id: 5,
    name: "แต้มล่าง",
    desc: "(สิบ+หน่วย) ล่าง mod 10",
    fn: (dt, i) => mod10(d(dt[i].bottom, 0) + d(dt[i].bottom, 1)),
  },
  {
    id: 6,
    name: "กระจกแต้มล่าง",
    desc: "9 − แต้มล่าง",
    fn: (dt, i) =>
      mod10(9 - mod10(d(dt[i].bottom, 0) + d(dt[i].bottom, 1))),
  },
  {
    id: 7,
    name: "สิบล่าง ×2",
    desc: "หลักสิบล่าง × 2 mod 10",
    fn: (dt, i) => mod10(d(dt[i].bottom, 0) * 2),
  },
  {
    id: 8,
    name: "|สิบ−หน่วย| ล่าง",
    desc: "|หลักสิบ − หลักหน่วย| ล่าง",
    fn: (dt, i) => Math.abs(d(dt[i].bottom, 0) - d(dt[i].bottom, 1)),
  },

  /* ─── กลุ่ม C: ข้ามบน-ล่าง ─── */
  {
    id: 9,
    name: "หน่วยบน+หน่วยล่าง",
    desc: "(หน่วยบน + หน่วยล่าง) mod 10",
    fn: (dt, i) => mod10(d(dt[i].top, 2) + d(dt[i].bottom, 1)),
  },
  {
    id: 10,
    name: "ร้อย×หน่วย บน",
    desc: "(ร้อย × หน่วยบน) mod 10",
    fn: (dt, i) => mod10(d(dt[i].top, 0) * d(dt[i].top, 2)),
  },
  {
    id: 11,
    name: "ร้อย+แต้มล่าง",
    desc: "(ร้อย + แต้มล่าง) mod 10",
    fn: (dt, i) =>
      mod10(d(dt[i].top, 0) + d(dt[i].bottom, 0) + d(dt[i].bottom, 1)),
  },
  {
    id: 12,
    name: "ผลรวม 5 หลัก",
    desc: "Σ(ร+ส+ห+สL+หL) mod 10",
    fn: (dt, i) =>
      mod10(
        d(dt[i].top, 0) +
          d(dt[i].top, 1) +
          d(dt[i].top, 2) +
          d(dt[i].bottom, 0) +
          d(dt[i].bottom, 1)
      ),
  },

  /* ─── กลุ่ม D: ใช้ข้อมูล 2 งวด ─── */
  {
    id: 13,
    name: "ร้อย 2 งวดรวม",
    desc: "(ร้อยนี้ + ร้อยก่อน) mod 10",
    fn: (dt, i) =>
      i < 1
        ? mod10(d(dt[i].top, 0) * 2)
        : mod10(d(dt[i].top, 0) + d(dt[i - 1].top, 0)),
  },
  {
    id: 14,
    name: "หน่วยบน 2 งวดรวม",
    desc: "(หน่วยนี้ + หน่วยก่อน) mod 10",
    fn: (dt, i) =>
      i < 1
        ? mod10(d(dt[i].top, 2) * 2)
        : mod10(d(dt[i].top, 2) + d(dt[i - 1].top, 2)),
  },
  {
    id: 15,
    name: "แต้ม 2 งวดรวม",
    desc: "(แต้มนี้ + แต้มก่อน) mod 10",
    fn: (dt, i) => {
      const p1 = mod10(d(dt[i].bottom, 0) + d(dt[i].bottom, 1));
      if (i < 1) return mod10(p1 * 2);
      const p2 = mod10(
        d(dt[i - 1].bottom, 0) + d(dt[i - 1].bottom, 1)
      );
      return mod10(p1 + p2);
    },
  },
  {
    id: 16,
    name: "|ΣTop−ΣBot|",
    desc: "|ผลรวมบน − ผลรวมล่าง| mod 10",
    fn: (dt, i) => {
      const st =
        d(dt[i].top, 0) + d(dt[i].top, 1) + d(dt[i].top, 2);
      const sb = d(dt[i].bottom, 0) + d(dt[i].bottom, 1);
      return mod10(Math.abs(st - sb));
    },
  },
];
