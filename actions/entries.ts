"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { TimeEntryRepository } from "@/lib/db/repositories/time-entry-repository";
import { CategoryRepository } from "@/lib/db/repositories/category-repository";

const schema = z.object({
  category_id: z.string().uuid("Aset tidak valid"),
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  minutes: z.coerce.number().int().min(1).max(1440, "Maks 1440 menit"),
  note: z.string().trim().max(200).optional().default(""),
});

export interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function logTime(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = schema.safeParse({
    category_id: formData.get("category_id"),
    entry_date: formData.get("entry_date"),
    minutes: formData.get("minutes"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const entryRepo = new TimeEntryRepository(supabase);
  const catRepo = new CategoryRepository(supabase);

  const category = await catRepo.findById(parsed.data.category_id);
  if (!category || category.user_id !== user.id) redirect("/app");

  try {
    await entryRepo.create(user.id, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mencatat waktu" };
  }

  revalidatePath("/app");
  return {};
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = await createClient();
  const repo = new TimeEntryRepository(supabase);
  await repo.delete(id);
  revalidatePath("/app");
}