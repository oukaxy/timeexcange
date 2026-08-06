import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export const getCurrentUser = cache(
  async (): Promise<User | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },
);

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export const getProfile = cache(
  async (userId: string): Promise<ProfileRow | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  },
);

export async function requireProfile(): Promise<{
  user: User;
  profile: ProfileRow;
}> {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  if (!profile) {
    // First login — create profile row via service path in an action,
    // or send to setup screen.
    redirect("/app/setup");
  }

  return { user, profile };
}
