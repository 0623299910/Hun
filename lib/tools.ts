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
    slug: "003-all-in-one",
    title: "3. all in one",
    fileName: "3.all in one.html",
    description: "รวมหลายสูตรไว้ในหน้าเดียว",
  },
  {
    slug: "004-hell-pairs",
    title: "4. คู่ดับนรกแตก",
    fileName: "4.คู่ดับนรกแตก.html",
    description: "วิเคราะห์คู่ดับแบบเข้มข้น",
  },
  {
    slug: "005-three-pair-formulas",
    title: "5. คู่ดับ 3 สูตรตรงๆ",
    fileName: "5.คู่ดับสามสูตร.html",
    description: "คำนวณคู่ดับจาก 3 สูตร",
  },
  {
    slug: "006-green-three",
    title: "6. สามเขียว",
    fileName: "6.สามเขียว.html",
    description: "โหมดคำนวณสามเขียว",
  },
  {
    slug: "008-cross-polarity",
    title: "8. ดับตรงๆชุดที่ 1",
    fileName: "8.คู่ข้ามขั้ว.html",
    description: "สูตรคู่ข้ามขั้ว",
  },
  {
    slug: "009-three-dead-pairs",
    title: "9. ดับสามคู่",
    fileName: "9.ดับสามคู่.html",
    description: "คำนวณคู่ดับ 3 คู่",
  },
  {
    slug: "010-three-think",
    title: "10. สามนึก",
    fileName: "10.สามนึก.html",
    description: "เครื่องมือสามนึก",
  },
  {
    slug: "011-direct-cut-4",
    title: "11. ดับตรงๆ4",
    fileName: "11.ดับตรงๆ4.html",
    description: "สูตรดับตรงรุ่น 4",
  },
  {
    slug: "012-direct-cut-v2",
    title: "12. ดับตรงๆ v2",
    fileName: "12.ดับตรงๆ v2.html",
    description: "สูตรดับตรงรุ่น v2",
  },
  {
    slug: "014-seven-bottom-three",
    title: "14. เจ็ดตัวล่างสูตรสาม",
    fileName: "14.เจ็ดตัวล่างสูตรสาม.html",
    description: "คำนวณ 7 ตัวล่างจาก 3 สูตร",
  },
  {
    slug: "015-seven-way-two",
    title: "15. ทางเลข7ตัวสอง",
    fileName: "15.ทางเลข7ตัวสอง.html",
    description: "ทางเลข 7 ตัวจาก 2 สูตร",
  },
  {
    slug: "016-overview",
    title: "16. สรุปภาพรวม",
    fileName: "16.สรุปภาพรวม.html",
    description: "สรุปผลภาพรวมทุกมุม",
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
    slug: "legacy-cloud-sim",
    title: "Cloude Simulator",
    fileName: "Cloude Simulator.html",
    description: "จำลองสถานการณ์แบบคลาวด์",
  },
  {
    slug: "legacy-gpt-sim",
    title: "GPT Simulator",
    fileName: "GPT Simulator.html",
    description: "จำลองผลแบบ GPT",
  },
  {
    slug: "legacy-simulator",
    title: "Simulator",
    fileName: "Simulator.html",
    description: "หน้าจอ Simulator",
  },
  {
    slug: "number-collision",
    title: "ชนเลข",
    fileName: "ชนเลข.html",
    description: "เปรียบเทียบเลขชน",
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
  {
    slug: "023-parity-gap",
    title: "23. คู่ดับคู่-คี่ Gap",
    fileName: "",
    description: "วิเคราะห์คู่ดับจากรูปแบบคู่-คี่ + ช่วง gap",
  },
  {
    slug: "024-mirror-dead",
    title: "24. คู่ดับกระจก",
    fileName: "",
    description: "สร้างคู่ดับจากภาพกระจก 9-complement หลายมุม",
  },
  {
    slug: "025-chain-break",
    title: "25. คู่ดับโซ่ขาด",
    fileName: "",
    description: "วิเคราะห์โซ่ตัวเลขต่อเนื่องเพื่อหาจุดขาด",
  },
  {
    slug: "026-digit-sum-pos",
    title: "26. คู่ดับผลรวมตำแหน่ง",
    fileName: "",
    description: "รวมเลขข้ามตำแหน่งหลายงวดด้วย carry-drop",
  },
  {
    slug: "027-rotation-dead",
    title: "27. คู่ดับหมุนวน",
    fileName: "",
    description: "หมุนตำแหน่งตัวเลขเป็นวงกลมหา dead zone",
  },
  {
    slug: "028-fibonacci-dead",
    title: "28. คู่ดับฟีโบนัชชี",
    fileName: "",
    description: "ใช้ลำดับ Fibonacci/Lucas เป็น offset ดับ",
  },
  {
    slug: "029-point-dead",
    title: "29. ดับคู่ล่างตรงๆ5คู่",
    fileName: "",
    description: "ปักหลักสิบ 5 สูตร × ปักหลักหน่วย 5 สูตร → คู่ดับล่าง 5 คู่",
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
    slug: "034-custom-pair-dead",
    title: "34. คู่ดับ 2 ตัวล่าง — เลือกสูตรเองได้",
    fileName: "",
    description: "เลือกสูตรใดก็ได้ 2 สูตรจาก 16 สูตรมาจับคู่เป็นคู่ดับ 2 ตัวล่าง พร้อมสถิติย้อนหลัง",
  },
  {
    slug: "035-combined-point-dead",
    title: "35. รวมดับแต้ม",
    fileName: "",
    description: "รวม 15 สูตรดับแต้ม พร้อมสถิติย้อนหลังและฉันทามติ",
  },
  {
    slug: "036-featured-8",
    title: "36. รวมสูตรเลขเด่น 8 ตัว",
    fileName: "",
    description: "รวม 10 สูตรเลขเด่น 8 ตัว (ไม่ซ้ำ) พร้อมสถิติย้อนหลัง 30 งวด",
  },
  {
    slug: "037-mega-dead",
    title: "37. MEGA รวมสูตรดับทุกรูปแบบ",
    fileName: "",
    description: "127 สูตรดับใน 6 หมวด — ดับตัวเดียว คู่ดับ แต้ม หลักสิบ หน่วย พร้อมสรุปข้ามหมวด",
  },
  {
    slug: "038-compare-tens-pin",
    title: "38. เทียบปักหลักสิบ",
    fileName: "",
    description: "เลขเด่นหลักสิบ 9 ตัว — 2 ชุด × 10 สูตร (ไม่ซ้ำกัน) จัดอันดับเดินดี + สถิติย้อนหลัง 20 งวด",
  },
  {
    slug: "039-parity-pair-dead",
    title: "39. ดับล่าง คู่-คี่",
    fileName: "",
    description: "15 สูตรดับคู่ล่าง — คู่+คู่ 5 สูตร / คี่+คี่ 5 สูตร / คู่+คี่ 5 สูตร",
  },
];

export const toolMap = new Map(legacyTools.map((tool) => [tool.slug, tool]));
