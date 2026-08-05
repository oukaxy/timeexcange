import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="font-mono text-2xl font-bold tracking-tight">
          TimeFolio
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola modal 24 jam harianmu.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
