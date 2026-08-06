import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";
import { AiSettingsForm } from "@/components/settings/ai-settings-form";

export const metadata: Metadata = { title: "Atur" };

export default async function SettingsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: aiSettings } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola modal harian, preferensi akun, dan kecerdasan buatan.
        </p>
      </div>
      <SettingsForm profile={profile} />
      <AiSettingsForm settings={aiSettings} />
    </div>
  );
}
