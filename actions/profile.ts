import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

const schema = z.object({
  display_name: z.string().trim().max(40).optional().default(""),
  reset_time: z.coerce.number().int().min(0).max(23),
  daily_hours: z.coerce.number().int().min(8).max(24),
});

export interface ActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function updateProfile(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = schema.safeParse({
    display_name: formData.get("display_name"),
    reset_time: formData.get("reset_time"),
    daily_hours: formData.get("daily_hours"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app");
  revalidatePath("/app/settings");
  return { success: true };
}