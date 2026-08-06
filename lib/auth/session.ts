import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

/**
 * Resolve the current user from the session cookie (JWT decode, no network).
 * The signed token is trusted for identity; live revocation checks are only
 * performed inside mutating Server Actions where needed.
 */
export const getCurrentUser = cache(
  async (): Promise<User | null> => {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user ?? null;
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
