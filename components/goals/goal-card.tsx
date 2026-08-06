"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Calculator,
  Check,
  Pause,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import { archiveGoal, setGoalStatus } from "@/actions/goals";
import {
  generateAiProjection,
  generateManualProjection,
} from "@/actions/projections";
import { cn } from "@/lib/utils";
import type { CategoryRow, GoalRow, ProjectionRow } from "@/types/database";

type Message = { type: "error" | "success"; text: string } | null;

export function GoalCard({
  goal,
  category,
  latestProjection,
}: {
  goal: GoalRow;
  category?: CategoryRow;
  latestProjection?: ProjectionRow;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);

  async function run(
    action: string,
    fn: () => Promise<{ error?: string; success?: string }>,
  ) {
    setPendingAction(action);
    setMessage(null);
    const res = await fn();
    if (res.error) setMessage({ type: "error", text: res.error });
    else if (res.success) setMessage({ type: "success", text: res.success });
    setPendingAction(null);
    router.refresh();
  }

  const busy = pendingAction !== null;
  const paused = goal.status === "paused";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{goal.title}</h3>
            {category && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${category.color}1A`, color: category.color }}
              >
                {category.name}
              </span>
            )}
          </div>
          {goal.description && (
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            paused
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          {paused ? "Di-jeda" : "Aktif"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Target className="h-4 w-4" />
          <span className="font-mono">{goal.weekly_hours} jam/minggu</span>
        </span>
        <span>selama {goal.horizon_months} bulan</span>
      </div>

      {goal.expected_outcome && (
        <p className="text-sm">
          <span className="font-medium text-card-foreground">Hasil: </span>
          {goal.expected_outcome}
        </p>
      )}

      {latestProjection && (
        <div className="space-y-1 rounded-lg bg-muted/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Proyeksi terakhir
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                latestProjection.source === "ai"
                  ? "bg-violet-500/10 text-violet-600"
                  : "bg-blue-500/10 text-blue-600",
              )}
            >
              {latestProjection.source === "ai" ? "AI" : "Manual"}
            </span>
          </div>
          <p className="text-sm">{latestProjection.result_summary}</p>
        </div>
      )}

      {message && (
        <p
          role="alert"
          className={cn(
            "text-sm",
            message.type === "error" ? "text-destructive" : "text-emerald-600",
          )}
        >
          {message.text}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run("manual", () => generateManualProjection(goal.id))}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border border-input px-3 text-sm font-medium transition-colors",
            "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Calculator className="h-4 w-4" />
          {pendingAction === "manual" ? "Menghitung..." : "Proyeksi Manual"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run("ai", () => generateAiProjection(goal.id))}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border border-input px-3 text-sm font-medium transition-colors",
            "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Sparkles className="h-4 w-4" />
          {pendingAction === "ai" ? "Meminta AI..." : "Proyeksi AI"}
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            disabled={busy}
            aria-label={paused ? "Lanjutkan" : "Jeda"}
            title={paused ? "Lanjutkan" : "Jeda"}
            onClick={() =>
              run("status", () =>
                setGoalStatus(goal.id, paused ? "active" : "paused"),
              )
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            type="button"
            disabled={busy}
            aria-label="Tandai selesai"
            title="Tandai selesai"
            onClick={() => run("done", () => setGoalStatus(goal.id, "done"))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={busy}
            aria-label="Arsipkan"
            title="Arsipkan"
            onClick={() => run("archive", () => archiveGoal(goal.id))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
