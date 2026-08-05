import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CategoryRow,
  Database,
  TimeEntryRow,
} from "@/types/database";

export type TimeEntryInput = {
  category_id: string;
  entry_date: string;
  minutes: number;
  note?: string;
};

export type EntryWithCategory = TimeEntryRow & {
  categories: Pick<
    CategoryRow,
    "id" | "name" | "icon" | "color" | "target_minutes"
  >;
};

export class TimeEntryRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async listForDate(
    userId: string,
    entryDate: string,
  ): Promise<EntryWithCategory[]> {
    const { data, error } = await this.db
      .from("time_entries")
      .select(
        "id, user_id, category_id, entry_date, minutes, note, created_at, categories(id, name, icon, color, target_minutes)",
      )
      .eq("user_id", userId)
      .eq("entry_date", entryDate)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as EntryWithCategory[];
  }

  /** Total invested minutes per category for a given date. */
  async minutesByCategory(
    userId: string,
    entryDate: string,
  ): Promise<Record<string, number>> {
    const { data, error } = await this.db
      .from("time_entries")
      .select("category_id, minutes")
      .eq("user_id", userId)
      .eq("entry_date", entryDate);

    if (error) throw new Error(error.message);

    const totals: Record<string, number> = {};
    for (const row of data ?? []) {
      totals[row.category_id] = (totals[row.category_id] ?? 0) + row.minutes;
    }
    return totals;
  }

  async create(userId: string, input: TimeEntryInput): Promise<void> {
    const { error } = await this.db.from("time_entries").insert({
      user_id: userId,
      ...input,
    });
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("time_entries").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}