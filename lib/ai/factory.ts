import type { SupabaseClient } from "@supabase/supabase-js";
import { OpenAICompatibleProvider } from "./openai-compatible";
import type { AIProvider } from "./types";
import type { Database } from "@/types/database";

export class AIProviderFactory {
  constructor(private readonly db: SupabaseClient<Database>) {}

  /**
   * Build the user's configured provider from their stored ai_settings.
   * Returns null when the user has not enabled an AI provider.
   */
  async createForUser(userId: string): Promise<AIProvider | null> {
    const { data, error } = await this.db
      .from("ai_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal membaca pengaturan AI: ${error.message}`);
    }

    if (!data || !data.enabled || !data.api_key) return null;

    const baseUrl = data.base_url.replace(/\/+$/, "");
    return new OpenAICompatibleProvider({
      baseUrl,
      apiKey: data.api_key,
      model: data.model,
    });
  }
}