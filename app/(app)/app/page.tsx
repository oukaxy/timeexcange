import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getDayWindow } from "@/lib/time";
import { CategoryRepository } from "@/lib/db/repositories/category-repository";
import { TimeEntryRepository } from "@/lib/db/repositories/time-entry-repository";
import { SaldoCard } from "@/components/saldo/saldo-card";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryProgressList } from "@/components/categories/category-progress-list";
import { EntryList } from "@/components/entries/entry-list";

export default async function DashboardPage() {
  const { user, profile } = await requireProfile();
  const now = new Date();
  const dayWindow = getDayWindow(now, profile.reset_time, profile.daily_hours);

  const supabase = await createClient();
  const categoryRepo = new CategoryRepository(supabase);
  const entryRepo = new TimeEntryRepository(supabase);

  const [categories, entries, minutesByCategory] = await Promise.all([
    categoryRepo.listActive(user.id),
    entryRepo.listForDate(user.id, dayWindow.date),
    entryRepo.minutesByCategory(user.id, dayWindow.date),
  ]);

  const investedMinutes = entries.reduce(
    (sum, e) => sum + e.minutes,
    0,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {dayWindow.date} · reset pukul{" "}
            {String(profile.reset_time).padStart(2, "0")}:00
          </p>
        </div>
      </div>

      <SaldoCard
        budgetMs={dayWindow.budgetMs}
        remainingMs={dayWindow.remainingMs}
        serverNow={now.getTime()}
        resetHour={profile.reset_time}
        investedMinutes={investedMinutes}
        dailyHours={profile.daily_hours}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <CategoryProgressList
            categories={categories}
            minutesByCategory={minutesByCategory}
          />
          <EntryList
            categories={categories}
            entries={entries}
            dayDate={dayWindow.date}
          />
        </div>

        <aside className="space-y-6">
          <CategoryForm />
        </aside>
      </div>
    </div>
  );
}