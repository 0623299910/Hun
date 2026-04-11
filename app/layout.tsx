import type { Metadata } from "next";
import { Noto_Sans_Thai, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { DataProvider } from "@/components/data-context";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

const plexThai = IBM_Plex_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Hun Formula Hub",
  description: "แอปรวมสูตรและเครื่องมือวิเคราะห์จากไฟล์ HTML เดิมทั้งหมด",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${notoSansThai.variable} ${plexThai.variable}`}>
        <DataProvider>
        <div className="min-h-screen bg-[linear-gradient(135deg,#f6efe6_0%,#fde0c6_45%,#f7b267_100%)] bg-grid bg-[size:22px_22px] text-ink">
          <div className="mx-auto grid max-w-[1800px] gap-4 p-4 md:grid-cols-[320px_1fr]">
            <Sidebar />
            <main className="min-w-0 rounded-3xl border border-ink/10 bg-white/70 p-4 shadow-soft backdrop-blur md:p-6">
              {children}
            </main>
          </div>
        </div>
        </DataProvider>
      </body>
    </html>
  );
}
