import { Trash2, Inbox } from "lucide-react";
import { deleteEntry } from "@/actions/entries";
import { formatMinutes } from "@/lib/time";
import { QuickLogForm } from "@/components/entries/quick-log";
import type { EntryWithCategory } from "@/lib/db/repositories/time-entry-repository";
import type { CategoryRow } from "@/types/database";

interface EntryListProps {
  categories: CategoryRow[];
  entries: EntryWithCategory[];
  dayDate: string;
}

export function EntryList({ categories, entries, dayDate }: EntryListProps) {
  return (
    <section className="space-y-3">
      <QuickLogForm categories={categories} dayDate={dayDate} />

      <h3 className="pt-2 text-base font-semibold">Catatan Hari Ini</h3>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          <Inbox className="h-8 w-8" />
          Belum ada catatan hari ini. Investasikan waktumu lewat form di atas.
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: entry.categories?.color ?? "#64748B",
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {entry.categories?.name ?? "Aset dihapus"}
                  </p>
                  {entry.note && (
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.note}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatMinutes(entry.minutes)}
                </span>
                <form action={deleteEntry.bind(null, entry.id)}>
                  <button
                    type="submit"
                    aria-label={`Hapus catatan ${entry.categories?.name ?? ""}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}