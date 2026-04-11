import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-2xl border border-ink/10 bg-white p-6 text-center shadow-soft">
        <p className="text-xs uppercase tracking-wide text-ink/60">404</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink">ไม่พบหน้าเครื่องมือ</h2>
        <p className="mt-2 text-sm text-ink/70">ตรวจสอบเมนูทางซ้ายแล้วเลือกเครื่องมืออีกครั้ง</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full border border-ink/20 bg-haze px-4 py-2 text-sm text-ink transition hover:bg-gold/35"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
