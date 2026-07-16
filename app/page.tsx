import Link from "next/link";
import { legacyTools } from "@/lib/tools";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-ink/10 bg-[linear-gradient(120deg,#102a43_0%,#2f6f59_100%)] p-6 text-white">
        <p className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs">Unified Next.js App</p>
        <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
          รวมสูตรคำนวณทั้งหมด<br />ไว้ในแอปเดียว
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-white/90 md:text-base">
          โปรเจกต์นี้ย้ายเครื่องมือจากไฟล์ HTML เดิมทั้งหมดมาอยู่ใน Web App เดียว
          พร้อมเมนูสารบัญด้านซ้ายและโครงสร้างที่พร้อมต่อยอดเป็นคอมโพเนนต์ Next.js เต็มรูปแบบ
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-6 py-3 font-bold text-white backdrop-blur-sm transition hover:bg-white/30 hover:shadow-lg"
        >
          <span className="text-xl">📊</span>
          <span>เปิด Dashboard - ดูทุกเครื่องมือในหน้าเดียว</span>
          <span className="text-xl">→</span>
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {legacyTools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tool/${tool.slug}`}
            className="group rounded-2xl border border-ink/10 bg-white p-4 transition hover:-translate-y-0.5 hover:border-pine/40 hover:shadow-soft"
          >
            <h3 className="font-display text-base font-semibold text-ink">{tool.title}</h3>
            <p className="mt-1 text-sm text-ink/70">{tool.description}</p>
            <span className="mt-3 inline-block text-xs text-pine group-hover:text-ink">
              เปิดเครื่องมือ
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
