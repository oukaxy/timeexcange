import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GoalRow, ProjectionRow } from "@/types/database";

export type ProjectionInput = {
  goalId: string;
  scenario: string;
  weeklyHours: number;
  horizonMonths: number;
  source: "manual" | "ai";
  resultSummary: string;
};

export type ProjectionWithGoal = ProjectionRow & {
  goals: Pick<GoalRow, "id" | "title" | "weekly_hours" | "horizon_months">;
};

export class ProjectionRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  /** Latest projection per goal for the user. */
  async latestPerGoal(userId: string): Promise<ProjectionRow[]> {
    const { data, error } = await this.db
      .from("projections")
      .select("*")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);

    const seen = new Set<string>();
    const latest: ProjectionRow[] = [];
    for (const row of data ?? []) {
      if (seen.has(row.goal_id)) continue;
      seen.add(row.goal_id);
      latest.push(row);
    }
    return latest;
  }

  async forGoal(goalId: string): Promise<ProjectionRow[]> {
    const { data, error } = await this.db
      .from("projections")
      .select("*")
      .eq("goal_id", goalId)
      .order("generated_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async create(userId: string, input: ProjectionInput): Promise<void> {
    const { error } = await this.db.from("projections").insert({
      user_id: userId,
      goal_id: input.goalId,
      scenario: input.scenario,
      weekly_hours: input.weeklyHours,
      horizon_months: input.horizonMonths,
      source: input.source,
      result_summary: input.resultSummary,
    });
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("projections").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
