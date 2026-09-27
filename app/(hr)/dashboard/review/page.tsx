"use client";

import { useEffect, useState } from "react";
import {
  getPendingReviewJobs,
  getInvitedJobs,
  getShortlist,
  getCvUrl,
  draftInvites,
  confirmInvites,
  stopProcess,
  type PendingReviewJob,
  type ShortlistedCandidate,
} from "@/lib/api";

function ScoreTag({ score }: { score: number | null }) {
  if (score == null) return <span className="font-mono text-sm text-muted">—</span>;
  const color = score >= 70 ? "text-green" : score >= 40 ? "text-amber" : "text-red";
  return <span className={`font-mono text-sm font-bold ${color}`}>{score}</span>;
}

export default function ReviewPage() {
  const [jobs, setJobs] = useState<PendingReviewJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistedCandidate[]>([]);
  const [loadingShortlist, setLoadingShortlist] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [showingDrafts, setShowingDrafts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"send" | "stop" | null>(null);

  // Invited jobs section
  const [invitedJobs, setInvitedJobs] = useState<PendingReviewJob[]>([]);
  const [expandedInvitedJobId, setExpandedInvitedJobId] = useState<number | null>(null);
  const [invitedShortlist, setInvitedShortlist] = useState<ShortlistedCandidate[]>([]);
  const [loadingInvitedShortlist, setLoadingInvitedShortlist] = useState(false);

  const loadJobs = async () => {
    const [pending, invited] = await Promise.all([
      getPendingReviewJobs(),
      getInvitedJobs(),
    ]);

    setJobs(pending);
    setInvitedJobs(invited);
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const currentJob = jobs.find((j) => j.id === expandedJobId);

  const loadShortlist = async (jobId: number) => {
    setLoadingShortlist(true);

    const data = await getShortlist(jobId);

    setShortlist(data);
    setShowingDrafts(
      data.length > 0 && data.every((c) => !!c.interviewEmailSubject)
    );

    setLoadingShortlist(false);
  };

  const handleExpand = (jobId: number) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      setStatusMsg(null);
      setConfirming(null);
      return;
    }

    setExpandedJobId(jobId);
    setStatusMsg(null);
    setConfirming(null);
    setInterviewDate("");
    loadShortlist(jobId);
  };

  const handleExpandInvited = async (jobId: number) => {
    if (expandedInvitedJobId === jobId) {
      setExpandedInvitedJobId(null);
      return;
    }

    setExpandedInvitedJobId(jobId);
    setLoadingInvitedShortlist(true);

    const data = await getShortlist(jobId);

    setInvitedShortlist(data);
    setLoadingInvitedShortlist(false);
  };

  const handleDraftInvites = async () => {
    if (!currentJob) return;

    setBusy(true);
    setStatusMsg(null);

    try {
      const data = await draftInvites(currentJob.id, interviewDate);

      setShortlist(data);
      setShowingDrafts(true);
    } catch (err) {
      setStatusMsg(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setBusy(false);
    }
  };

  const updateDraft = (
    id: number,
    field: "interviewEmailSubject" | "interviewEmailBody",
    value: string
  ) => {
    setShortlist((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              [field]: value,
            }
          : c
      )
    );
  };

  const handleConfirmSend = async () => {
    if (!currentJob) return;

    setBusy(true);
    setStatusMsg(null);

    try {
      const result = await confirmInvites(
        currentJob.id,
        shortlist.map((c) => ({
          applicationId: c.id,
          subject: c.interviewEmailSubject ?? "",
          body: c.interviewEmailBody ?? "",
        }))
      );

      const failed =
        result.sendResults?.filter((r: any) => !r.sent) ?? [];

      if (failed.length > 0) {
        setStatusMsg(
          `Sent, but ${failed.length} email(s) failed to deliver — check the candidate's address.`
        );
      } else {
        setConfirming(null);
        setExpandedJobId(null);
        await loadJobs();
      }
    } catch (err) {
      setStatusMsg(
        err instanceof Error ? err.message : "Sending failed"
      );
    } finally {
      setBusy(false);
    }
  };

  const handleStopProcess = async () => {
    if (!currentJob) return;

    setBusy(true);
    setStatusMsg(null);

    try {
      await stopProcess(currentJob.id);

      setConfirming(null);
      setExpandedJobId(null);

      await loadJobs();
    } catch (err) {
      setStatusMsg(
        err instanceof Error ? err.message : "Stopping failed"
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-muted">Loading review queue...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-2">
        Review
      </h1>

      <p className="text-muted text-sm mb-8">
        Roles where the agent has shortlisted candidates and is waiting on
        your decision.
      </p>

      {jobs.length === 0 && (
        <p className="text-muted text-sm">
          Nothing waiting on review right now.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {jobs.map((job) => {
          const isExpanded = expandedJobId === job.id;

          return (
            <div
              key={job.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <button
                onClick={() => handleExpand(job.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="font-display font-medium">
                  {job.title}
                </span>

                <span className="font-mono text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
                  {job.status === "pending_review"
                    ? "TARGET REACHED"
                    : "IN PROGRESS"}
                </span>
              </button>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border">
                  {loadingShortlist && (
                    <p className="text-muted text-sm">
                      Loading shortlist...
                    </p>
                  )}

                  {!loadingShortlist && !showingDrafts && (
                    <>
                      <div className="flex flex-col gap-3 mb-5">
                        {shortlist.map((c) => (
                          <div
                            key={c.id}
                            className="pb-3 border-b border-border last:border-0"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">
                                {c.candidateName}
                              </span>

                              <ScoreTag score={c.score} />
                            </div>

                            <p className="text-xs text-muted mb-1.5">
                              {c.scoreReason}
                            </p>

                            <a
                              href={getCvUrl(c.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[10px] text-amber underline"
                            >
                              View CV
                            </a>

                            {c.candidateId && (
                              <a
                                href={`/candidates/${c.candidateId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-[10px] text-amber underline ml-3"
                              >
                                View profile & chat
                              </a>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mb-4">
                        <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
                          PROPOSED INTERVIEW DATE (OPTIONAL)
                        </label>

                        <input
                          type="date"
                          value={interviewDate}
                          onChange={(e) =>
                            setInterviewDate(e.target.value)
                          }
                          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleDraftInvites}
                          disabled={busy}
                          className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {busy
                            ? "Drafting..."
                            : `Draft Invitation${
                                shortlist.length > 1 ? "s" : ""
                              }`}
                        </button>

                        {confirming === "stop" ? (
                          <>
                            <button
                              onClick={handleStopProcess}
                              disabled={busy}
                              className="text-sm bg-red text-[#2A0808] rounded-lg px-4 py-2"
                            >
                              {busy ? "Working..." : "Confirm stop"}
                            </button>

                            <button
                              onClick={() => setConfirming(null)}
                              className="text-sm border border-border rounded-lg px-4 py-2 hover:bg-bg transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirming("stop")}
                            className="text-sm border border-red text-red rounded-lg px-4 py-2 hover:bg-red/10 transition-colors"
                          >
                            Stop Process
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {!loadingShortlist && showingDrafts && (
                    <>
                      <p className="text-sm text-muted mb-4">
                        The agent drafted the email
                        {shortlist.length > 1 ? "s" : ""} below. Edit
                        anything, then confirm to send.
                      </p>

                      <div className="flex flex-col gap-4 mb-5">
                        {shortlist.map((c) => (
                          <div
                            key={c.id}
                            className="pb-4 border-b border-border last:border-0"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {c.candidateName}
                              </span>

                              <span className="font-mono text-[10px] text-muted">
                                {c.candidateEmail}
                              </span>
                            </div>

                            <div className="mb-2">
                              <label className="font-mono text-[10px] text-muted tracking-wide block mb-1">
                                SUBJECT
                              </label>

                              <input
                                value={c.interviewEmailSubject ?? ""}
                                onChange={(e) =>
                                  updateDraft(
                                    c.id,
                                    "interviewEmailSubject",
                                    e.target.value
                                  )
                                }
                                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
                              />
                            </div>

                            <div>
                              <label className="font-mono text-[10px] text-muted tracking-wide block mb-1">
                                BODY
                              </label>

                              <textarea
                                rows={6}
                                value={c.interviewEmailBody ?? ""}
                                onChange={(e) =>
                                  updateDraft(
                                    c.id,
                                    "interviewEmailBody",
                                    e.target.value
                                  )
                                }
                                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        {confirming === "send" ? (
                          <>
                            <button
                              onClick={handleConfirmSend}
                              disabled={busy}
                              className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {busy ? "Sending..." : "Yes, send now"}
                            </button>

                            <button
                              onClick={() => setConfirming(null)}
                              className="text-sm border border-border rounded-lg px-4 py-2 hover:bg-bg transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirming("send")}
                            disabled={busy}
                            className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            Confirm &amp; Send
                          </button>
                        )}

                        <button
                          onClick={() => setShowingDrafts(false)}
                          className="text-sm border border-border rounded-lg px-4 py-2 hover:bg-bg transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    </>
                  )}

                  {statusMsg && (
                    <p className="text-red text-sm mt-3">
                      {statusMsg}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sent Invitations */}
      {invitedJobs.length > 0 && (
        <>
          <h2 className="font-display text-lg font-medium mt-10 mb-4">
            Sent invitations
          </h2>

          <div className="flex flex-col gap-4">
            {invitedJobs.map((job) => {
              const isExpanded = expandedInvitedJobId === job.id;

              return (
                <div
                  key={job.id}
                  className="rounded-xl border border-border bg-surface p-5"
                >
                  <button
                    onClick={() => handleExpandInvited(job.id)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div>
                      <span className="font-display font-medium">
                        {job.title}
                      </span>

                      {/* NEW: invited timestamp */}
                      {job.invitedAt && (
                        <p className="text-xs text-muted mt-1">
                          Invites sent{" "}
                          {new Date(
                            job.invitedAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <span className="font-mono text-[10px] text-green border border-green/30 bg-green/10 rounded px-1.5 py-0.5">
                      INVITED
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border">
                      {loadingInvitedShortlist && (
                        <p className="text-muted text-sm">
                          Loading...
                        </p>
                      )}

                      {!loadingInvitedShortlist &&
                        invitedShortlist.map((c) => (
                          <div
                            key={c.id}
                            className="pb-4 mb-4 border-b border-border last:border-0 last:pb-0 last:mb-0"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">
                                {c.candidateName}
                              </span>

                              <span className="font-mono text-[10px] text-muted">
                                {c.candidateEmail}
                              </span>
                            </div>

                            <p className="font-mono text-[10px] text-muted mb-1">
                              SUBJECT
                            </p>

                            <p className="text-sm mb-2">
                              {c.interviewEmailSubject}
                            </p>

                            <p className="font-mono text-[10px] text-muted mb-1">
                              BODY
                            </p>

                            <p className="text-sm text-muted whitespace-pre-wrap">
                              {c.interviewEmailBody}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}