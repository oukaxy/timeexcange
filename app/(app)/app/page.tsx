import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser, getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getDayWindow } from "@/lib/time";
import { CategoryRepository } from "@/lib/db/repositories/category-repository";
import { TimeEntryRepository } from "@/lib/db/repositories/time-entry-repository";
import { SaldoCard } from "@/components/saldo/saldo-card";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryProgressList } from "@/components/categories/category-progress-list";
import { EntryList } from "@/components/entries/entry-list";

function HeaderSkeleton() {
  return <div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />;
}

function SectionSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-5 animate-pulse rounded bg-muted"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader userId={user.id} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <SaldoCardSection userId={user.id} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Suspense fallback={<SectionSkeleton lines={3} />}>
            <CategoriesSection userId={user.id} />
          </Suspense>
          <Suspense fallback={<SectionSkeleton lines={5} />}>
            <EntriesSection userId={user.id} />
          </Suspense>
        </div>

        <aside className="space-y-6">
          <CategoryForm />
        </aside>
      </div>
    </div>
  );
}

async function DashboardHeader({ userId }: { userId: string }) {
  const profile = await getProfile(userId);
  if (!profile) redirect("/app/setup");

  const dayWindow = getDayWindow(new Date(), profile.reset_time, profile.daily_hours);

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {dayWindow.date} · reset pukul{" "}
          {String(profile.reset_time).padStart(2, "0")}:00
        </p>
      </div>
    </div>
  );
}

async function SaldoCardSection({ userId }: { userId: string }) {
  const profile = await getProfile(userId);
  if (!profile) redirect("/app/setup");

  const now = new Date();
  const dayWindow = getDayWindow(now, profile.reset_time, profile.daily_hours);

  const supabase = await createClient();
  const entryRepo = new TimeEntryRepository(supabase);
  const entries = await entryRepo.listForDate(userId, dayWindow.date);
  const investedMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);

  return (
    <SaldoCard
      budgetMs={dayWindow.budgetMs}
      remainingMs={dayWindow.remainingMs}
      serverNow={now.getTime()}
      resetHour={profile.reset_time}
      investedMinutes={investedMinutes}
      dailyHours={profile.daily_hours}
    />
  );
}

async function CategoriesSection({ userId }: { userId: string }) {
  const profile = await getProfile(userId);
  if (!profile) redirect("/app/setup");

  const dayWindow = getDayWindow(new Date(), profile.reset_time, profile.daily_hours);
  const supabase = await createClient();

  const [categories, entries] = await Promise.all([
    new CategoryRepository(supabase).listActive(userId),
    new TimeEntryRepository(supabase).listForDate(userId, dayWindow.date),
  ]);

  const minutesByCategory = TimeEntryRepository.totalsByCategory(entries);

  return (
    <CategoryProgressList
      categories={categories}
      minutesByCategory={minutesByCategory}
    />
  );
}

async function EntriesSection({ userId }: { userId: string }) {
  const profile = await getProfile(userId);
  if (!profile) redirect("/app/setup");

  const dayWindow = getDayWindow(new Date(), profile.reset_time, profile.daily_hours);
  const supabase = await createClient();

  const [categories, entries] = await Promise.all([
    new CategoryRepository(supabase).listActive(userId),
    new TimeEntryRepository(supabase).listForDate(userId, dayWindow.date),
  ]);

  return (
    <EntryList
      categories={categories}
      entries={entries}
      dayDate={dayWindow.date}
    />
  );
}
