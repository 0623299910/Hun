import Link from "next/link";
import { notFound } from "next/navigation";
import { toolMap, legacyTools } from "@/lib/tools";
import { ToolRouter } from "@/components/tool-router";

// Pre-generate all tool pages at build time for static export
export function generateStaticParams() {
  return legacyTools.map((tool) => ({ slug: tool.slug }));
}

type ToolPageProps = {
  params: {
    slug: string;
  };
};

export default function ToolPage({ params }: ToolPageProps) {
  const tool = toolMap.get(params.slug);

  if (!tool) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink/10 bg-white p-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink md:text-2xl">{tool.title}</h2>
          <p className="mt-1 text-sm text-ink/70">{tool.description}</p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-ink/20 bg-haze px-4 py-2 text-sm text-ink transition hover:bg-gold/35"
        >
          กลับหน้าหลัก
        </Link>
      </div>

      <ToolRouter slug={params.slug} />
    </div>
  );
}
