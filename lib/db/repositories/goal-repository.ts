import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GoalRow } from "@/types/database";

export type GoalInput = {
  title: string;
  description?: string;
  category_id?: string | null;
  weekly_hours: number;
  horizon_months: number;
  expected_outcome?: string;
};

export type GoalStatus = GoalRow["status"];

export class GoalRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async listActive(userId: string): Promise<GoalRow[]> {
    const { data, error } = await this.db
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findById(id: string): Promise<GoalRow | null> {
    const { data, error } = await this.db
      .from("goals")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async create(userId: string, input: GoalInput): Promise<void> {
    const { error } = await this.db.from("goals").insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? "",
      category_id: input.category_id ?? null,
      weekly_hours: input.weekly_hours,
      horizon_months: input.horizon_months,
      expected_outcome: input.expected_outcome ?? "",
    });
    if (error) throw new Error(error.message);
  }

  async setStatus(id: string, status: GoalStatus): Promise<void> {
    const { error } = await this.db
      .from("goals")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async archive(id: string): Promise<void> {
    const { error } = await this.db
      .from("goals")
      .update({ status: "archived" })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
