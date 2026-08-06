import { requireUser } from "@/lib/auth/session";
import { AppNav } from "@/components/nav/app-nav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <AppNav user={user} />
      <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
        {children}
      </main>
    </div>
  );
}
