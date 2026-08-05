import { formatMinutes } from "@/lib/time";
import type { CategoryRow } from "@/types/database";

interface CategoryProgressListProps {
  categories: CategoryRow[];
  minutesByCategory: Record<string, number>;
}

export function CategoryProgressList({
  categories,
  minutesByCategory,
}: CategoryProgressListProps) {
  if (categories.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Belum ada aset. Tambahkan aset pertamamu di kolom samping untuk mulai
        mengalokasikan modal waktumu.
      </section>
    );
  }

  const totalInvested = Object.values(minutesByCategory).reduce(
    (sum, m) => sum + m,
    0,
  );

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Alokasi Aset</h2>
        <p className="text-xs text-muted-foreground">
          Total {formatMinutes(totalInvested)} hari ini
        </p>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const invested = minutesByCategory[cat.id] ?? 0;
          const target = cat.target_minutes;
          const ratio =
            target > 0 ? Math.min(1, invested / target) : invested > 0 ? 1 : 0;
          const reached = target > 0 && invested >= target;

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
                  >
                    <Dot />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {cat.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      target {target > 0 ? formatMinutes(target) : "tanpa target"}
                    </p>
                  </div>
                </div>
                <p className="font-mono text-sm font-semibold tabular-nums">
                  {formatMinutes(invested)}
                  {target > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      / {formatMinutes(target)}
                    </span>
                  )}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(ratio * 100)}%`,
                      backgroundColor: reached ? "#059669" : cat.color,
                    }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-muted-foreground">
                  {Math.round(ratio * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Dot() {
  return <span className="h-2 w-2 rounded-full bg-current" />;
}
