import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { GoalRepository } from "@/lib/db/repositories/goal-repository";
import { ProjectionRepository } from "@/lib/db/repositories/projection-repository";
import { CategoryRepository } from "@/lib/db/repositories/category-repository";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalCard } from "@/components/goals/goal-card";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Goals</h1>
        <p className="text-sm text-muted-foreground">
          Tentukan tujuan dan proyeksi hasil investasi waktumu.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
        }
      >
        <GoalsBoard userId={user.id} />
      </Suspense>
    </div>
  );
}

async function GoalsBoard({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [goals, projections, categories] = await Promise.all([
    new GoalRepository(supabase).listActive(userId),
    new ProjectionRepository(supabase).latestPerGoal(userId),
    new CategoryRepository(supabase).listActive(userId),
  ]);

  const latestByGoal = new Map(
    projections.map((p) => [p.goal_id, p]),
  );
  const categoryById = new Map(
    categories.map((c) => [c.id, c]),
  );

  return (
    <div className="space-y-6">
      <GoalForm categories={categories} />

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm font-medium">Belum ada goal</p>
          <p className="text-sm text-muted-foreground">
            Tambah tujuan pertamamu untuk mulai memproyeksikan hasil investasi
            waktu.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              category={categoryById.get(goal.category_id ?? "")}
              latestProjection={latestByGoal.get(goal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
