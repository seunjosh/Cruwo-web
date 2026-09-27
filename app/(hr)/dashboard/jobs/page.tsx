"use client";

import { useEffect, useState } from "react";
import {
  getAllJobs,
  getAllApplications,
  updateJob,
  toggleArchiveJob,
  reopenJob,
  deleteJob,
  type JobFull,
  type Application,
} from "@/lib/api";


export default function ManageJobsPage() {
  const [jobs, setJobs] = useState<JobFull[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [editShortlistTarget, setEditShortlistTarget] = useState("");
  const [editOnTargetReached, setEditOnTargetReached] = useState("pause");
  const [editAutoScreen, setEditAutoScreen] = useState(true);

  const [reportJobId, setReportJobId] = useState<number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyLink = (jobId: number, source?: string) => {
    const url = `${window.location.origin}/jobs/${jobId}${source ? `?source=${source}` : ""}`;
    navigator.clipboard.writeText(url);
    setCopiedId(jobId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const loadAll = async () => {
    setLoading(true);
    const [jobsData, appsData] = await Promise.all([getAllJobs(), getAllApplications()]);
    setJobs(jobsData);
    setApplications(appsData);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const startEdit = (job: JobFull) => {
    setEditingId(job.id);
    setEditTitle(job.title);
    setEditDescription(job.description ?? "");
    let reqs: string[] = [];
    try {
      reqs = job.requirements ? JSON.parse(job.requirements) : [];
    } catch {
      reqs = [];
    }
    setEditRequirements(reqs.join("\n"));
    setEditShortlistTarget(job.shortlistTarget != null ? String(job.shortlistTarget) : "");
    setEditOnTargetReached(job.onTargetReached ?? "pause");
    setEditAutoScreen(job.autoScreen ?? true);
  };

  const handleSaveEdit = async (jobId: number) => {
    setBusy(true);
    try {
      await updateJob(jobId, {
        title: editTitle,
        description: editDescription,
        requirements: editRequirements.split("\n").filter(Boolean),
        shortlistTarget: editShortlistTarget || null,
        onTargetReached: editOnTargetReached,
        autoScreen: editAutoScreen,
      });
      setEditingId(null);
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async (jobId: number) => {
    setBusy(true);
    try {
      await toggleArchiveJob(jobId);
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Archive failed");
    } finally {
      setBusy(false);
    }
  };

  const handleReopen = async (jobId: number) => {
    setBusy(true);
    try {
      await reopenJob(jobId);
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Reopen failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    setBusy(true);
    try {
      await deleteJob(jobId);
      setConfirmingDeleteId(null);
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const buildReport = (jobId: number) => {
    const jobApps = applications.filter((a) => a.jobId === jobId);
    const bySource: Record<string, number> = {};
    jobApps.forEach((a: any) => {
      const src = a.source ?? "direct";
      bySource[src] = (bySource[src] ?? 0) + 1;
    });
    return {
      total: jobApps.length,
      received: jobApps.filter((a) => a.status === "received").length,
      shortlisted: jobApps.filter((a) => a.status === "shortlisted").length,
      rejected: jobApps.filter((a) => a.status === "rejected").length,
      invited: jobApps.filter((a) => a.status === "invited").length,
      bySource,
    };
  };

  if (loading) {
    return <div className="p-8 text-muted">Loading jobs...</div>;
  }

  const activeJobs = jobs.filter((j) => !j.archived);
  const archivedJobs = jobs.filter((j) => j.archived);

  const renderJob = (job: JobFull) => {
    const isEditing = editingId === job.id;
    const isReporting = reportJobId === job.id;
    const report = isReporting ? buildReport(job.id) : null;

    if (isEditing) {
      return (
        <div key={job.id} className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">TITLE</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">DESCRIPTION</label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
              REQUIREMENTS (one per line)
            </label>
            <textarea
              rows={5}
              value={editRequirements}
              onChange={(e) => setEditRequirements(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
              SHORTLIST TARGET
            </label>
            <input
              type="number"
              min={1}
              value={editShortlistTarget}
              onChange={(e) => setEditShortlistTarget(e.target.value)}
              placeholder="leave blank for unlimited"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
            />
          </div>


          <p className="text-xs text-muted mb-4">
  Posted {new Date(job.createdAt).toLocaleDateString()}
  {job.expiresAt && ` · Expires ${new Date(job.expiresAt).toLocaleDateString()}`}
</p>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
              WHEN TARGET IS REACHED
            </label>
            <select
              value={editOnTargetReached}
              onChange={(e) => setEditOnTargetReached(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
            >
              <option value="pause">Pause — notify me right away</option>
              <option value="collect">Keep collecting — I&apos;ll decide when to stop</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={editAutoScreen}
              onChange={(e) => setEditAutoScreen(e.target.checked)}
              className="w-4 h-4 accent-amber"
            />
            <span className="text-sm">Auto-screen candidates as they apply</span>
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => handleSaveEdit(job.id)}
              disabled={busy}
              className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save changes"}
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="font-display text-sm font-medium border border-border rounded-lg px-4 py-2 hover:bg-bg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={job.id} className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="font-display font-medium">{job.title}</span>
          <span className="font-mono text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
            {job.status?.toUpperCase() ?? "OPEN"}
          </span>
        </div>
        <p className="text-xs text-muted mb-4">
          {job.shortlistTarget != null ? `Shortlist target: ${job.shortlistTarget}` : "No shortlist target set"}
          {" · "}
          {job.autoScreen ? "Auto-screen on" : "Manual screening"}
        </p>

        {isReporting && report && (
          <div className="mb-4 pt-4 border-t border-border flex flex-col gap-1.5 text-sm">
            <p>Total applications: <span className="text-text">{report.total}</span></p>
            <p>Shortlisted: <span className="text-green">{report.shortlisted}</span></p>
            <p>Rejected: <span className="text-red">{report.rejected}</span></p>
            <p>Invited: <span className="text-green">{report.invited}</span></p>
            <p>Awaiting screening: <span className="text-amber">{report.received}</span></p>
            {Object.entries(report.bySource).map(([src, count]) => (
              <p key={src} className="capitalize">{src}: <span className="text-text">{count}</span></p>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap items-start">
          <button
            onClick={() => startEdit(job)}
            className="font-display text-xs font-medium bg-amber text-[#1A1204] rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            Edit
          </button>
          {job.status !== "open" && (
            <button
              onClick={() => handleReopen(job.id)}
              disabled={busy}
              className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-bg transition-colors"
            >
              Reopen
            </button>
          )}
          <button
            onClick={() => setReportJobId(isReporting ? null : job.id)}
            className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-bg transition-colors"
          >
            {isReporting ? "Hide report" : "Report"}
          </button>
          <button
            onClick={() => handleArchive(job.id)}
            disabled={busy}
            className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-bg transition-colors"
          >
            {job.archived ? "Unarchive" : "Archive"}
          </button>
          {confirmingDeleteId === job.id ? (
            <>
              <button
                onClick={() => handleDelete(job.id)}
                disabled={busy}
                className="text-xs bg-red text-[#2A0808] rounded-lg px-3 py-1.5"
              >
                Confirm delete
              </button>
              <button
                onClick={() => setConfirmingDeleteId(null)}
                className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-bg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmingDeleteId(job.id)}
              className="text-xs border border-red text-red rounded-lg px-3 py-1.5 hover:bg-red/10 transition-colors"
            >
              Delete
            </button>
          )}

          <div className="relative group">
            <button className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-bg transition-colors">
              {copiedId === job.id ? "Copied!" : "Copy apply link"}
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover:flex flex-col bg-surface border border-border rounded-lg p-1 z-10 min-w-[140px]">
              <button
                onClick={() => copyLink(job.id)}
                className="text-xs text-left px-2 py-1.5 hover:bg-bg rounded transition-colors"
              >
                Direct link
              </button>
              <button
                onClick={() => copyLink(job.id, "linkedin")}
                className="text-xs text-left px-2 py-1.5 hover:bg-bg rounded transition-colors"
              >
                For LinkedIn
              </button>
              <button
                onClick={() => copyLink(job.id, "indeed")}
                className="text-xs text-left px-2 py-1.5 hover:bg-bg rounded transition-colors"
              >
                For Indeed
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-2">Manage jobs</h1>
      <p className="text-muted text-sm mb-8">
        Edit, archive, delete, reopen, or view a quick report for any posted role.
      </p>

      <div className="flex flex-col gap-4">
        {activeJobs.length === 0 && <p className="text-muted text-sm">No jobs posted yet.</p>}
        {activeJobs.map(renderJob)}
      </div>

      {archivedJobs.length > 0 && (
        <>
          <h2 className="font-display text-lg font-medium mt-10 mb-4">Archived</h2>
          <div className="flex flex-col gap-4">{archivedJobs.map(renderJob)}</div>
        </>
      )}
    </div>
  );
}