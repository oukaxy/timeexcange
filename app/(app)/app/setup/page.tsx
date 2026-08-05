import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { SetupForm } from "@/components/auth/setup-form";

export const metadata: Metadata = {
  title: "Pengaturan Awal",
};

export default async function SetupPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Selamat datang</h1>
        <p className="text-sm text-muted-foreground">
          Siapkan modal harianmu — saldo 24 jam yang akan menemanimu tiap hari.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <SetupForm />
      </div>
    </div>
  );
}
