import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { User, FileText, Bot, Briefcase } from "lucide-react";
import {  SERVER_API_URL } from "@/lib/api";
import { CandidateLogoutButton } from "@/components/candidate/components/candidate/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

async function requireCandidateSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cruwo_candidate_session");

  if (!sessionCookie) {
    redirect("/candidate-login");
  }

 const res = await fetch(`${SERVER_API_URL}/candidate-auth/me`, {
    headers: {
      Cookie: `cruwo_candidate_session=${sessionCookie.value}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/candidate-login");
  }

  return res.json() as Promise<{
    candidateId: number;
    email: string;
  }>;
}

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const candidate = await requireCandidateSession();

  const navItems = [
    {
      href: "/profile",
      label: "My Profile",
      icon: User,
    },
    {
      href: "/my-applications",
      label: "My Applications",
      icon: FileText,
    },
    {
      href: "/my-twin",
      label: "My Digital Twin",
      icon: Bot,
    },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border flex flex-col shrink-0">
        {/* Logo */}
        <Link
          href="/profile"
          className="h-16 flex items-center px-6 border-b border-border"
        >
          <span className="font-display font-bold text-lg">
            Cruwo
          </span>
        </Link>

        {/* Navigation */}
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

          {/* Open Roles */}
          <a
            href="/careers"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:text-text hover:bg-surface transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            Open Roles
          </a>
        </nav>

        {/* Candidate Footer */}
        <div className="px-6 py-4 border-t border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] text-muted truncate">
              {candidate.email}
            </p>

            <ThemeToggle />
          </div>

          <CandidateLogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}