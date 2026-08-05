"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Play } from "lucide-react";
import { logTime, type ActionResult } from "@/actions/entries";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/database";

interface QuickLogProps {
  categories: CategoryRow[];
  dayDate: string;
}

export function QuickLogForm({ categories, dayDate }: QuickLogProps) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    logTime,
    {},
  );
  const hasCategories = categories.length > 0;

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <h3 className="text-sm font-semibold">Catat Waktu</h3>

      <input type="hidden" name="entry_date" value={dayDate} />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Aset</span>
        <select
          name="category_id"
          required
          disabled={!hasCategories}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {!hasCategories && <option>Belum ada aset</option>}
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Menit</span>
          <input
            name="minutes"
            type="number"
            min={1}
            max={1440}
            required
            defaultValue={30}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Catatan (opsional)</span>
        <input
          name="note"
          maxLength={200}
          placeholder="Contoh: latihan 45 menit"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </label>

      {state.fieldErrors?.minutes && (
        <p role="alert" className="text-sm text-destructive">
          {state.fieldErrors.minutes[0]}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton pending={pending} disabled={!hasCategories} />
    </form>
  );
}

function SubmitButton({
  pending,
  disabled,
}: {
  pending: boolean;
  disabled: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const busy = pending || formPending;

  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors",
        "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <Play className="h-4 w-4" />
      {busy ? "Menyimpan..." : "Catat"}
    </button>
  );
}