import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LayoutDashboard, Briefcase, GitBranch, ClipboardCheck, FilePlus, Settings, ListChecks } from "lucide-react";
import {  SERVER_API_URL } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Users } from "lucide-react";



// Runs on the server before any HR page renders. Reads the session cookie
// directly from the incoming request and asks the backend to verify it —
// if there's no valid session, the user is redirected to /login before
// any dashboard content or data is ever sent to the browser.
async function requireSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cruwo_session");

  if (!sessionCookie) {
    redirect("/login");
  }

  const res = await fetch(`${SERVER_API_URL}/auth/me`, {
    headers: { Cookie: `cruwo_session=${sessionCookie.value}` },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/login");
  }

  return res.json() as Promise<{ userId: number; email: string }>;
}

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/post", label: "Post a Job", icon: FilePlus },
    { href: "/dashboard/jobs", label: "Manage Jobs", icon: Briefcase },
    { href: "/dashboard/pipeline", label: "Pipeline", icon: GitBranch },
    { href: "/dashboard/review", label: "Review", icon: ClipboardCheck },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/dashboard/forms", label: "Application Forms", icon: ListChecks },
    { href: "/dashboard/talent", label: "Talent Pool", icon: Users },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
  <img src="/Cruwo-logo.svg" alt="Cruwo" className="h-8" />
</Link>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:text-text hover:bg-surface transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-border">
          <p className="font-mono text-[11px] text-muted truncate">{user.email}</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>

      <div className="px-6 py-4 border-t border-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
  <p className="font-mono text-[11px] text-muted truncate">{user.email}</p>
  <ThemeToggle />
</div>
<LogoutButton />
    </div>
  </div>

);
}