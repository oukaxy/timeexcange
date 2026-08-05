"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createCategory, type ActionResult } from "@/actions/categories";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#2563EB",
  "#059669",
  "#7C3AED",
  "#D97706",
  "#0891B2",
  "#DC2626",
  "#9333EA",
  "#64748B",
];

export function CategoryForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createCategory,
    {},
  );
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
      >
        <Plus className="h-4 w-4" />
        Tambah Aset
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Aset Baru</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-medium text-muted-foreground hover:text-card-foreground"
        >
          Batal
        </button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nama aset</span>
        <input
          name="name"
          required
          maxLength={40}
          placeholder="Belajar, Kerja, Olahraga..."
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </label>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Warna</span>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Pilih warna ${c}`}
              className={cn(
                "h-8 w-8 rounded-full transition-transform",
                color === c && "scale-110 ring-2 ring-ring ring-offset-2 ring-offset-card",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Target harian (menit)</span>
        <input
          name="target_minutes"
          type="number"
          min={0}
          max={1440}
          defaultValue={0}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </label>

      <input type="hidden" name="icon" value="Circle" />

      {state.fieldErrors?.name && (
        <p role="alert" className="text-sm text-destructive">
          {state.fieldErrors.name[0]}
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
        {pending ? "Menyimpan..." : "Simpan Aset"}
      </button>
    </form>
  );
}
