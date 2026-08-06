"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

const schema = z.object({
  base_url: z
    .string()
    .trim()
    .url("URL provider tidak valid")
    .max(200),
  model: z.string().trim().min(1, "Nama model wajib diisi").max(100),
  api_key: z.string().trim().min(1, "Kunci API wajib diisi").max(300),
  enabled: z.boolean().default(false),
});

export interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function upsertAiSettings(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = schema.safeParse({
    base_url: formData.get("base_url"),
    model: formData.get("model"),
    api_key: formData.get("api_key"),
    enabled: formData.get("enabled") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const payload = {
    user_id: user.id,
    base_url: parsed.data.base_url,
    model: parsed.data.model,
    api_key: parsed.data.api_key,
    enabled: parsed.data.enabled,
  };

  const { data: existing } = await supabase
    .from("ai_settings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("ai_settings").update(payload).eq("id", existing.id)
    : await supabase.from("ai_settings").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/settings");
  return { success: true };
}
