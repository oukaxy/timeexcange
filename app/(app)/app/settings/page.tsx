import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/session";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata: Metadata = { title: "Atur" };

export default async function SettingsPage() {
  const { profile } = await requireProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola modal harian dan preferensi akunmu.
        </p>
      </div>
      <SettingsForm profile={profile} />
    </div>
  );
}