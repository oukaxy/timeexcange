"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (authError) {
      setError(authError.message);
      setStatus("idle");
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <Mail className="mx-auto h-8 w-8 text-primary" />
        <p className="font-medium text-card-foreground">Cek emailmu</p>
        <p className="text-sm text-muted-foreground">
          Kami kirim link masuk ke <span className="font-medium">{email}</span>.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm font-medium text-primary hover:underline"
        >
          Ganti email
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <label htmlFor="email" className="block space-y-1.5">
        <span className="text-sm font-medium">Email</span>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="kamu@contoh.com"
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors",
          "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {status === "loading" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            Mengirim...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Kirim Link Masuk
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground">
        Tak perlu kata sandi — kamu akan menerima link ajaib di email.
      </p>
    </form>
  );
}
