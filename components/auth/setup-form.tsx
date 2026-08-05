"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SetupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [resetTime, setResetTime] = useState(0);
  const [dailyHours, setDailyHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError("Sesi berakhir. Silakan masuk lagi.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      display_name: displayName,
      timezone,
      reset_time: resetTime,
      daily_hours: dailyHours,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.replace("/app");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="displayName" className="text-sm font-medium">
          Nama panggilan
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Misal: Wisnu"
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="resetTime" className="text-sm font-medium">
          Jam reset saldo harian
        </label>
        <select
          id="resetTime"
          value={resetTime}
          onChange={(e) => setResetTime(Number(e.target.value))}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}:00 — {h === 0 ? "tengah malam" : h < 12 ? "pagi" : h === 12 ? "siang" : h < 18 ? "sore" : "malam"}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Setiap {String(resetTime).padStart(2, "0")}:00 saldo 24 jam diisi ulang.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="dailyHours" className="text-sm font-medium">
          Modal harian ({dailyHours} jam)
        </label>
        <input
          id="dailyHours"
          type="range"
          min={8}
          max={24}
          value={dailyHours}
          onChange={(e) => setDailyHours(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          Zona waktu terdeteksi: <span className="font-medium">{timezone}</span>
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors",
          "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {loading ? "Menyimpan..." : "Mulai Investasi Waktu"}
      </button>
    </form>
  );
}
