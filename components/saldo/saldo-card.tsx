"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatRemaining, formatMinutes } from "@/lib/time";
import { cn } from "@/lib/utils";

interface SaldoCardProps {
  budgetMs: number;
  remainingMs: number;
  /** Timestamp (ms) when the server rendered the snapshot */
  serverNow: number;
  resetHour: number;
  investedMinutes: number;
  dailyHours: number;
}

const CELLS = 24;

export function SaldoCard({
  budgetMs,
  remainingMs,
  serverNow,
  resetHour,
  investedMinutes,
  dailyHours,
}: SaldoCardProps) {
  const [now, setNow] = useState(serverNow);
  const elapsedAtRender = budgetMs - remainingMs;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = elapsedAtRender + (now - serverNow);
  const remaining = Math.max(0, budgetMs - elapsedMs);
  const hoursPassed = elapsedMs / 3_600_000;
  const filledCells = Math.min(CELLS, Math.max(0, Math.floor(hoursPassed)));

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            Sisa modal hari ini
          </p>
          <p
            className="font-mono text-5xl font-bold tracking-tight tabular-nums sm:text-6xl"
            style={remaining > 0 ? { textShadow: "0 0 24px rgba(5,150,105,0.35)" } : undefined}
          >
            {formatRemaining(remaining)}
          </p>
          <p className="text-sm text-muted-foreground">
            dari {dailyHours} jam · reset {resetHour}:00 · sudah investasi{" "}
            <span className="font-medium text-card-foreground">
              {formatMinutes(investedMinutes)}
            </span>
          </p>
        </div>
      </div>

      <div
        className="mt-6 grid grid-cols-8 gap-1.5 sm:grid-cols-12"
        role="img"
        aria-label={`Saldo waktu harian: ${filledCells} dari ${CELLS} jam telah berlalu`}
      >
        {Array.from({ length: CELLS }, (_, i) => {
          const passed = i < filledCells;
          return (
            <span
              key={i}
              className={cn(
                "aspect-square rounded-md transition-colors",
                passed
                  ? "bg-foreground/10"
                  : "bg-emerald-500/20 ring-1 ring-inset ring-emerald-500/40",
              )}
            />
          );
        })}
      </div>

      <p className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>Terjadi {formatElapsed(elapsedMs)}</span>
        <span>Reset {String(resetHour).padStart(2, "0")}:00</span>
      </p>
    </section>
  );
}

function formatElapsed(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}j ${String(m).padStart(2, "0")}m`;
}