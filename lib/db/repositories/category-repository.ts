import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryRow, Database } from "@/types/database";

export type CategoryInput = {
  name: string;
  icon: string;
  color: string;
  target_minutes: number;
};

export class CategoryRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async listActive(userId: string): Promise<CategoryRow[]> {
    const { data, error } = await this.db
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findById(id: string): Promise<CategoryRow | null> {
    const { data, error } = await this.db
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async create(userId: string, input: CategoryInput): Promise<void> {
    const { error } = await this.db.from("categories").insert({
      user_id: userId,
      ...input,
    });
    if (error) throw new Error(error.message);
  }

  async update(id: string, input: Partial<CategoryInput>): Promise<void> {
    const { error } = await this.db
      .from("categories")
      .update(input)
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async archive(id: string): Promise<void> {
    const { error } = await this.db
      .from("categories")
      .update({ archived: true })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
