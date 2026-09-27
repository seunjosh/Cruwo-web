"use client";

import { useEffect, useState } from "react";
import { getApplications, getUsers, type PipelineApplication, type SimpleUser } from "@/lib/api";
import { PipelineRun } from "@/components/dashboard/pipeline-run";

export default function PipelinePage() {
  const [applications, setApplications] = useState<PipelineApplication[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [apps, userList] = await Promise.all([getApplications(), getUsers()]);
    setApplications(apps);
    setUsers(userList);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-muted">Loading pipeline...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-2">Pipeline</h1>
      <p className="text-muted text-sm mb-8">
        Every candidate, whichever path they applied through, scored by the same agent.
      </p>
      <div className="flex flex-col gap-4">
        {applications.length === 0 && <p className="text-muted text-sm">No applications yet.</p>}
        {applications.map((app) => (
          <PipelineRun key={app.id} app={app} users={users} onChanged={load} />
        ))}
      </div>
    </div>
  );
}