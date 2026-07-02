import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireProfile();

  async function signOut() {
    "use server";
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-navy text-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-lg font-bold">
            e
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">efin CRM</div>
            <div className="text-[11px] text-white/60">Media &amp; Event Sales</div>
          </div>
        </div>

        <SidebarNav isAdmin={profile.role === "admin"} />

        <div className="mt-auto border-t border-white/10 px-5 py-4">
          <div className="mb-2 truncate text-xs text-white/70">
            {profile.full_name || profile.email}
            <span className="ml-1 rounded bg-brand/30 px-1.5 py-0.5 text-[10px] uppercase">
              {profile.role}
            </span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
