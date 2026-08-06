"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { GoalRepository } from "@/lib/db/repositories/goal-repository";
import { ProjectionRepository } from "@/lib/db/repositories/projection-repository";
import { TimeEntryRepository } from "@/lib/db/repositories/time-entry-repository";
import { projectInvestment } from "@/lib/projection";
import { AIProviderFactory } from "@/lib/ai/factory";

export interface ActionResult {
  error?: string;
  success?: string;
}

const DAY_MS = 86_400_000;

export async function generateManualProjection(
  goalId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const goalRepo = new GoalRepository(supabase);

  const goal = await goalRepo.findById(goalId);
  if (!goal || goal.user_id !== user.id) redirect("/app/goals");

  const result = projectInvestment({
    weeklyHours: goal.weekly_hours,
    horizonMonths: goal.horizon_months,
  });

  const summary =
    `Proyeksi manual: ${goal.weekly_hours} jam/minggu selama ` +
    `${goal.horizon_months} bulan → sekitar ${result.totalHours} jam total ` +
    `(${result.hoursPerDay} jam/hari, konsisten ${result.daysPerWeek} hari/minggu).`;

  try {
    const repo = new ProjectionRepository(supabase);
    await repo.create(user.id, {
      goalId,
      scenario: "base",
      weeklyHours: goal.weekly_hours,
      horizonMonths: goal.horizon_months,
      source: "manual",
      resultSummary: summary,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menyimpan proyeksi" };
  }

  revalidatePath("/app/goals");
  return { success: "Proyeksi manual tersimpan." };
}

export async function generateAiProjection(
  goalId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const goalRepo = new GoalRepository(supabase);

  const goal = await goalRepo.findById(goalId);
  if (!goal || goal.user_id !== user.id) redirect("/app/goals");

  const provider = await new AIProviderFactory(supabase).createForUser(user.id);
  if (!provider) {
    return {
      error:
        "AI belum dikonfigurasi. Isi kunci API di menu Atur → bagian AI dulu.",
    };
  }

  const sinceDate = new Date(Date.now() - 14 * DAY_MS)
    .toISOString()
    .slice(0, 10);
  const recent = await new TimeEntryRepository(
    supabase,
  ).recentWithCategory(user.id, sinceDate);

  const recentLines =
    recent.length === 0
      ? "(belum ada data waktu 14 hari terakhir)"
      : recent
          .slice(0, 20)
          .map((r) => `- ${r.category_name}: ${r.minutes} menit`)
          .join("\n");

  const prompt = [
    "Kamu analis investasi waktu. Beri perkiraan realistis jam/minggu untuk goal user.",
    `Goal: ${goal.title}`,
    goal.description ? `Deskripsi: ${goal.description}` : "",
    goal.expected_outcome ? `Hasil yang diharapkan: ${goal.expected_outcome}` : "",
    `Target saat ini: ${goal.weekly_hours} jam/minggu selama ${goal.horizon_months} bulan.`,
    "",
    "Alokasi waktu aktual 14 hari terakhir (per kategori):",
    recentLines,
    "",
    'Balas HANYA JSON tanpa markdown: {"weekly_hours": <angka 0-80>, "narrative": "<2-3 kalimat bahasa Indonesia, saran + estimasi dampak>"}',
  ]
    .filter(Boolean)
    .join("\n");

  let raw: string;
  try {
    raw = await provider.complete({
      model: "",
      messages: [
        { role: "system", content: "Kamu ringkas dan realistis." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 300,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menghubungi AI" };
  }

  const parsed = parseJsonObject(raw);
  if (!parsed || typeof parsed.weekly_hours !== "number") {
    return { error: "Respons AI tidak valid. Coba lagi." };
  }

  const weeklyHours = clamp(parsed.weekly_hours, 0.5, 80);
  const narrative =
    typeof parsed.narrative === "string"
      ? parsed.narrative.slice(0, 500)
      : "Proyeksi AI berhasil dibuat.";

  const summary = `Proyeksi AI: ${weeklyHours} jam/minggu realistis selama ${goal.horizon_months} bulan. ${narrative}`;

  try {
    const repo = new ProjectionRepository(supabase);
    await repo.create(user.id, {
      goalId,
      scenario: "base",
      weeklyHours,
      horizonMonths: goal.horizon_months,
      source: "ai",
      resultSummary: summary,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menyimpan proyeksi" };
  }

  revalidatePath("/app/goals");
  return { success: "Proyeksi AI tersimpan." };
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}
