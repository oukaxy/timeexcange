"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateProfile, type ActionResult } from "@/actions/profile";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

export function SettingsForm({ profile }: { profile: ProfileRow }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateProfile,
    {},
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nama panggilan</span>
        <input
          name="display_name"
          defaultValue={profile.display_name}
          maxLength={40}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Jam reset saldo</span>
        <select
          name="reset_time"
          defaultValue={profile.reset_time}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}:00
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Saldo harian diisi ulang di jam ini.
        </p>
      </label>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">
          Modal harian: <span className="font-mono">{profile.daily_hours} jam</span>
        </span>
        <input
          name="daily_hours"
          type="range"
          min={8}
          max={24}
          defaultValue={profile.daily_hours}
          className="w-full accent-primary"
        />
      </div>

      {state.fieldErrors?.display_name && (
        <p role="alert" className="text-sm text-destructive">
          {state.fieldErrors.display_name[0]}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors",
          "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {state.success && <Check className="h-4 w-4" />}
        {pending ? "Menyimpan..." : state.success ? "Tersimpan" : "Simpan"}
      </button>
    </form>
  );
}