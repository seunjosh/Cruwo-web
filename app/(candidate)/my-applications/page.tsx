"use client";

import { useEffect, useState } from "react";
import { getMyApplications, type MyApplication } from "@/lib/api";

function statusColor(status: string) {
  if (status === "Shortlisted" || status === "Invited to interview") return "text-green";
  if (status === "Not selected") return "text-red";
  return "text-amber";
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyApplications().then((data) => { setApplications(data); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-muted">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-2">My applications</h1>
      <p className="text-muted text-sm mb-8">Track the status of every role you&apos;ve applied to.</p>

      {applications.length === 0 && (
        <p className="text-muted text-sm">
          You haven&apos;t applied to anything yet — <a href="/careers" className="text-amber underline">browse open roles</a>.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {applications.map((app) => (
          <div key={app.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-display font-medium">{app.jobTitle}</span>
              <span className={`text-xs font-medium ${statusColor(app.status)}`}>{app.status}</span>
            </div>
            <p className="text-xs text-muted">Applied {new Date(app.submittedAt).toLocaleDateString()}</p>
            {app.interviewEmailSubject && (
              <p className="text-xs text-green mt-2">Check your email — you&apos;ve been invited to interview.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}