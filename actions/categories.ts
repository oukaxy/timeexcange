import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { CategoryRepository } from "@/lib/db/repositories/category-repository";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama aset wajib diisi")
    .max(40, "Maks 40 karakter"),
  icon: z.string().max(40).optional().default("Circle"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna tidak valid"),
  target_minutes: z.coerce.number().int().min(0).max(1440),
});

export interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createCategory(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon"),
    color: formData.get("color"),
    target_minutes: formData.get("target_minutes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const repo = new CategoryRepository(supabase);

  try {
    await repo.create(user.id, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menyimpan aset" };
  }

  revalidatePath("/app");
  return {};
}

export async function updateCategoryTarget(
  id: string,
  target_minutes: number,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const repo = new CategoryRepository(supabase);
  const cat = await repo.findById(id);

  if (!cat || cat.user_id !== user.id) redirect("/app");

  try {
    await repo.update(id, { target_minutes });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal memperbarui" };
  }

  revalidatePath("/app");
  return {};
}

export async function archiveCategory(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const repo = new CategoryRepository(supabase);
  const cat = await repo.findById(id);

  if (!cat || cat.user_id !== user.id) redirect("/app");

  try {
    await repo.archive(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal mengarsipkan" };
  }

  revalidatePath("/app");
  return {};
}