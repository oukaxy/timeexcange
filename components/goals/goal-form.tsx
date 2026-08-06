"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Plus, Target } from "lucide-react";
import { createGoal, type ActionResult } from "@/actions/goals";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/database";

export function GoalForm({ categories }: { categories: CategoryRow[] }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createGoal,
    {},
  );
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
      >
        <Plus className="h-4 w-4" />
        Tambah Goal
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Target className="h-4 w-4" />
          Goal Baru
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-medium text-muted-foreground hover:text-card-foreground"
        >
          Batal
        </button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Judul goal</span>
        <input
          name="title"
          required
          maxLength={80}
          placeholder="Misal: Menguasai TypeScript lanjutan"
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Deskripsi</span>
        <textarea
          name="description"
          maxLength={300}
          rows={2}
          placeholder="Kenapa goal ini penting?"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Aset terkait (opsional)</span>
        <select
          name="category_id"
          defaultValue=""
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        >
          <option value="">Tanpa aset</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Investasi (jam/minggu)</span>
          <input
            name="weekly_hours"
            type="number"
            step="0.5"
            min={0.5}
            max={168}
            required
            defaultValue={5}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Horizon (bulan)</span>
          <input
            name="horizon_months"
            type="number"
            min={1}
            max={120}
            required
            defaultValue={6}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Hasil yang diharapkan</span>
        <input
          name="expected_outcome"
          maxLength={300}
          placeholder="Misal: bisa ngoding proyek nyata dengan percaya diri"
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </label>

      {state.fieldErrors?.title && (
        <p role="alert" className="text-sm text-destructive">
          {state.fieldErrors.title[0]}
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
        {pending ? "Menyimpan..." : "Simpan Goal"}
      </button>
    </form>
  );
}
