export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  id: string;
  email: string;
  display_name: string;
  timezone: string;
  reset_time: number;
  daily_hours: number;
  theme: "system" | "light" | "dark";
  created_at: string;
  updated_at: string;
};

export type AiSettingsRow = {
  id: string;
  user_id: string;
  base_url: string;
  model: string;
  api_key: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  target_minutes: number;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type TimeEntryRow = {
  id: string;
  user_id: string;
  category_id: string;
  entry_date: string;
  minutes: number;
  note: string;
  created_at: string;
};

export type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category_id: string | null;
  weekly_hours: number;
  horizon_months: number;
  expected_outcome: string;
  status: "active" | "paused" | "done" | "archived";
  created_at: string;
  updated_at: string;
};

export type ProjectionRow = {
  id: string;
  user_id: string;
  goal_id: string;
  scenario: string;
  weekly_hours: number;
  horizon_months: number;
  source: "manual" | "ai";
  result_summary: string;
  generated_at: string;
};

export type ChallengeRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category_id: string | null;
  required_days: number;
  min_minutes: number;
  status: "active" | "done" | "failed" | "archived";
  created_at: string;
};

export type StreakRow = {
  id: string;
  user_id: string;
  category_id: string;
  current_streak: number;
  best_streak: number;
  last_day: string | null;
  updated_at: string;
};

export type ChatMessageRow = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type RowView<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: never[];
};

export interface Database {
  public: {
    Tables: {
      profiles: RowView<ProfileRow>;
      ai_settings: RowView<AiSettingsRow>;
      categories: RowView<CategoryRow>;
      time_entries: RowView<TimeEntryRow>;
      goals: RowView<GoalRow>;
      projections: RowView<ProjectionRow>;
      challenges: RowView<ChallengeRow>;
      streaks: RowView<StreakRow>;
      chat_messages: RowView<ChatMessageRow>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
