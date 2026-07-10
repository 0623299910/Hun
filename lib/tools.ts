export type LegacyTool = {
  slug: string;
  title: string;
  fileName: string;
  description: string;
};

export const legacyTools: LegacyTool[] = [
  {
    slug: "001-hundreds-cut",
    title: "1. ดับจากหลักร้อย",
    fileName: "1.ดับจากหลักร้อย.html",
    description: "วิเคราะห์เลขดับจากหลักร้อย",
  },
  {
    slug: "002-low-probability",
    title: "2. โอกาสมาน้อยที่สุด",
    fileName: "2.โอกาสมาน้อยที่สุด.html",
    description: "หาเลขที่โอกาสออกน้อยจากสถิติ",
  },
  {
    slug: "003-tens-ones-dead",
    title: "3. ดับจากหลัก 10-หน่วย งวดก่อน (3 สูตร)",
    fileName: "",
    description: "3 สูตรคู่ดับจากงวดก่อน: (1) 10-หน่วยล่าง, (2) 10-หน่วยบน, (3) 10บน×หน่วยล่าง พร้อมสถิติย้อนหลังทุกงวด",
  },
  {
    slug: "032-single-dead-16",
    title: "32. รวมสูตรดับตัวเดียว 16 สูตร",
    fileName: "",
    description: "รวม 16 สูตรดับตัวเดียว พร้อมเทียบผลย้อนหลังและฉันทามติ",
  },
  {
    slug: "033-pair-dead-8",
    title: "33. คู่ดับ 8 คู่ (จาก 16 สูตร)",
    fileName: "",
    description: "จับคู่สูตรดับตัวเดียว 16 สูตร เป็นคู่ดับ 2 ตัวล่าง 8 คู่ พร้อมเทียบย้อนหลัง",
  },
  {
    slug: "036-featured-8",
    title: "36. รวมสูตรเลขเด่น 8 ตัว",
    fileName: "",
    description: "รวม 10 สูตรเลขเด่น 8 ตัว (ไม่ซ้ำ) พร้อมสถิติย้อนหลัง 30 งวด",
  },
  {
    slug: "034-custom-pair-dead",
    title: "34. คู่ดับ 2 ตัวล่าง — เลือกสูตรเองได้",
    fileName: "",
    description: "เลือกสูตรใดก็ได้ 2 สูตรจาก 16 สูตรมาจับคู่เป็นคู่ดับ 2 ตัวล่าง พร้อมสถิติย้อนหลัง",
  },
  {
    slug: "040-featured-7",
    title: "40. สูตรเด่นเจ็ดตัว",
    fileName: "",
    description: "12 สูตรเลขเด่น 7 ตัว (ไม่ซ้ำ) — ถูก = สองตัวล่างครอบ 1-2 ตัว | สถิติย้อนหลัง 25 งวด",
  },
  {
    slug: "029-point-dead",
    title: "29. ดับคู่ล่างตรงๆ5คู่",
    fileName: "",
    description: "ปักหลักสิบ 5 สูตร × ปักหลักหน่วย 5 สูตร → คู่ดับล่าง 5 คู่",
  },
  {
    slug: "005-three-pair-formulas",
    title: "5. คู่ดับ 3 สูตรตรงๆ",
    fileName: "5.คู่ดับสามสูตร.html",
    description: "คำนวณคู่ดับจาก 3 สูตร",
  },
  {
    slug: "008-cross-polarity",
    title: "8. ดับตรงๆชุดที่ 1",
    fileName: "8.คู่ข้ามขั้ว.html",
    description: "สูตรคู่ข้ามขั้ว",
  },
  {
    slug: "012-direct-cut-v2",
    title: "12. ดับตรงๆ v2",
    fileName: "12.ดับตรงๆ v2.html",
    description: "สูตรดับตรงรุ่น v2",
  },
  {
    slug: "011-direct-cut-4",
    title: "11. ดับตรงๆ4",
    fileName: "11.ดับตรงๆ4.html",
    description: "สูตรดับตรงรุ่น 4",
  },
  {
    slug: "016-overview",
    title: "16. สรุปภาพรวม",
    fileName: "16.สรุปภาพรวม.html",
    description: "สรุปผลภาพรวมทุกมุม",
  },
  {
    slug: "015-seven-way-two",
    title: "15. ทางเลข7ตัวสอง",
    fileName: "15.ทางเลข7ตัวสอง.html",
    description: "ทางเลข 7 ตัวจาก 2 สูตร",
  },
  {
    slug: "038-compare-tens-pin",
    title: "38. เทียบปักหลักสิบ",
    fileName: "",
    description: "เลขเด่นหลักสิบ 9 ตัว — 2 ชุด × 10 สูตร (ไม่ซ้ำกัน) จัดอันดับเดินดี + สถิติย้อนหลัง 20 งวด",
  },
  {
    slug: "017-random-one",
    title: "17. สุ่ม1",
    fileName: "17.สุ่ม1.html",
    description: "เครื่องมือสุ่มแบบที่ 1",
  },
  {
    slug: "018-random-two",
    title: "18. สุ่ม2",
    fileName: "18.สุ่ม2.html",
    description: "เครื่องมือสุ่มแบบที่ 2",
  },
  {
    slug: "022-luck-meter",
    title: "22. วัดดวง",
    fileName: "22.วัดดวง.html",
    description: "เครื่องมือวัดดวงจากข้อมูล",
  },
  {
    slug: "004-hell-pairs",
    title: "4. คู่ดับนรกแตก",
    fileName: "4.คู่ดับนรกแตก.html",
    description: "วิเคราะห์คู่ดับแบบเข้มข้น",
  },
  {
    slug: "006-green-three",
    title: "6. สามเขียว",
    fileName: "6.สามเขียว.html",
    description: "โหมดคำนวณสามเขียว",
  },
  {
    slug: "010-three-think",
    title: "10. สามนึก",
    fileName: "10.สามนึก.html",
    description: "เครื่องมือสามนึก",
  },
  {
    slug: "039-parity-pair-dead",
    title: "39. ดับล่าง คู่-คี่",
    fileName: "",
    description: "15 สูตรดับคู่ล่าง — คู่+คู่ 5 สูตร / คี่+คี่ 5 สูตร / คู่+คี่ 5 สูตร",
  },
  {
    slug: "legacy-simulator",
    title: "Simulator",
    fileName: "Simulator.html",
    description: "หน้าจอ Simulator",
  },
  {
    slug: "legacy-gpt-sim",
    title: "GPT Simulator",
    fileName: "GPT Simulator.html",
    description: "จำลองผลแบบ GPT",
  },
  {
    slug: "legacy-cloud-sim",
    title: "Cloude Simulator",
    fileName: "Cloude Simulator.html",
    description: "จำลองสถานการณ์แบบคลาวด์",
  },
  {
    slug: "number-collision",
    title: "ชนเลข",
    fileName: "ชนเลข.html",
    description: "เปรียบเทียบเลขชน",
  },
  {
    slug: "009-three-dead-pairs",
    title: "9. ดับสามคู่",
    fileName: "9.ดับสามคู่.html",
    description: "คำนวณคู่ดับ 3 คู่",
  },
  {
    slug: "latest-point-cut",
    title: "ดับจากแต้มล่าสุด",
    fileName: "ดับจากแต้มล่าสุด.html",
    description: "ดับเลขจากแต้มล่าสุด",
  },
  {
    slug: "global-stats",
    title: "สถิติรวม",
    fileName: "สถิติรวม.html",
    description: "สถิติรวมทุกสูตร",
  },
];

export const toolMap = new Map(legacyTools.map((tool) => [tool.slug, tool]));
