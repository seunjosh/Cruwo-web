"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, ClipboardCheck, Users, CheckCircle2, Mail } from "lucide-react";
import { getDashboardStats, type DashboardStats } from "@/lib/api";

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-border bg-surface p-5 hover:border-amber/40 transition-colors">
      <Icon className="w-5 h-5 text-amber mb-3" />
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold mb-2">Overview</h1>
      <p className="text-muted mb-8">Your hiring at a glance.</p>

      {!stats ? (
        <p className="text-muted text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
          <StatCard icon={Briefcase} label="Open roles" value={stats.openJobs} href="/dashboard/jobs" />
          <StatCard
            icon={ClipboardCheck}
            label="Waiting on your review"
            value={stats.pendingReview}
            href="/dashboard/review"
          />
          <StatCard
            icon={Users}
            label="Total applications"
            value={stats.totalApplications}
            href="/dashboard/pipeline"
          />
          <StatCard
            icon={CheckCircle2}
            label="Shortlisted"
            value={stats.shortlisted}
            href="/dashboard/pipeline"
          />
          <StatCard icon={Mail} label="Invited to interview" value={stats.invited} href="/dashboard/review" />
        </div>
      )}
    </div>
  );
}