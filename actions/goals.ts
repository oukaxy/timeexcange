"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { GoalRepository } from "@/lib/db/repositories/goal-repository";

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul goal wajib diisi")
    .max(80, "Maks 80 karakter"),
  description: z.string().max(300).optional().default(""),
  category_id: z.string().uuid().optional().or(z.literal("")),
  weekly_hours: z.coerce
    .number()
    .min(0.5, "Minimal 0,5 jam/minggu")
    .max(168, "Maks 168 jam/minggu"),
  horizon_months: z.coerce.number().int().min(1, "Minimal 1 bulan").max(120),
  expected_outcome: z.string().max(300).optional().default(""),
});

export interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createGoal(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    weekly_hours: formData.get("weekly_hours"),
    horizon_months: formData.get("horizon_months"),
    expected_outcome: formData.get("expected_outcome"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const repo = new GoalRepository(supabase);

  try {
    await repo.create(user.id, {
      ...parsed.data,
      category_id: parsed.data.category_id || null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menyimpan goal" };
  }

  revalidatePath("/app/goals");
  return {};
}

export async function setGoalStatus(
  id: string,
  status: "active" | "paused" | "done",
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const repo = new GoalRepository(supabase);
  const goal = await repo.findById(id);

  if (!goal || goal.user_id !== user.id) redirect("/app/goals");

  try {
    await repo.setStatus(id, status);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal memperbarui" };
  }

  revalidatePath("/app/goals");
  return {};
}

export async function archiveGoal(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const repo = new GoalRepository(supabase);
  const goal = await repo.findById(id);

  if (!goal || goal.user_id !== user.id) redirect("/app/goals");

  try {
    await repo.archive(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengarsipkan" };
  }

  revalidatePath("/app/goals");
  return {};
}
