import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/session";
import { Construction } from "lucide-react";

export const metadata: Metadata = { title: "Laporan" };

export default async function ReportsPage() {
  await requireProfile();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Laporan</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Lihat kemana modal waktumu benar-benar mengalir.
      </p>
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <Construction className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Grafik & Analisis</p>
        <p className="text-sm text-muted-foreground">Sedang dibangun.</p>
      </div>
    </div>
  );
}