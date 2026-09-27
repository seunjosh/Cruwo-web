"use client";

import { useState } from "react";
import {
  type PipelineApplication,
  retryScoring,
  screenApplication,
  toggleArchiveApplication,
  removeApplication,
  SimpleUser
} from "@/lib/api";

function stageForStatus(status: string) {
  const order = ["received", "shortlisted", "rejected"];
  return order.indexOf(status);
}

function ScoreTag({ score }: { score: number | null }) {
  if (score == null) return <span className="font-mono text-sm text-muted">—</span>;
  const color = score >= 70 ? "text-green" : score >= 40 ? "text-amber" : "text-red";
  return <span className={`font-mono text-sm font-bold ${color}`}>{score}</span>;
}

// Mirrors the original app's CI/CD-pipeline visual: a dot per stage,
// connected by a line that fills as the candidate progresses, red at the
// end if rejected.
export function PipelineRun({
  app,
  users,
  onChanged,
}: {
  app: PipelineApplication;
  users: SimpleUser[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const stages = ["Applied", "Extracted", "Scored", app.status === "rejected" ? "Rejected" : "Shortlisted"];
  const activeIdx = app.status === "rejected" ? 3 : stageForStatus(app.status) === -1 ? 0 : stageForStatus(app.status) + 1;
  const isUnscored = app.status === "received";

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-display font-medium">{app.candidateName}</span>
          {app.candidateId && (
            <a
              href={`/candidates/${app.candidateId}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] text-amber underline"
            >
              View profile & chat
            </a>
          )}
        </div>

                   <span className="font-mono text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
          {app.applicationMethod === "guided" ? "GUIDED" : "QUICK"}


          
        </span>
      </div>

      <div className="flex items-center mb-4">
        {stages.map((label, i) => {
          const isLast = i === stages.length - 1;
          const failed = isLast && app.status === "rejected";
          const passed = i < activeIdx || (i === activeIdx && !failed);
          const active = i === activeIdx && !passed && !failed;
          return (
            <div key={label} className="contents">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    failed
                      ? "bg-red border-red"
                      : passed
                      ? "bg-green border-green"
                      : active
                      ? "bg-amber border-amber shadow-[0_0_0_4px_rgba(245,166,35,0.2)]"
                      : "bg-muted/20 border-muted/20"
                  }`}
                />
                <span className="font-mono text-[9px] text-muted tracking-wide">{label.toUpperCase()}</span>
              </div>
              {!isLast && (
                <div className={`h-0.5 flex-[2] -mt-4 ${i < activeIdx ? "bg-green" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted flex-1 pr-4">{app.scoreReason ?? "Awaiting screening"}</p>
        <ScoreTag score={app.score} />
      </div>

      {app.assignedToId != null && (
        <p className="text-xs text-amber mb-3">
          Assigned to {users.find((u) => u.id === app.assignedToId)?.name ?? `User #${app.assignedToId}`} for review
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        {isUnscored && (
          <>
            <button
              onClick={() => run(() => retryScoring(app.id))}
              disabled={busy}
              className="font-display text-xs font-medium bg-amber text-[#1A1204] rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? "Working..." : "Retry scoring"}
            </button>
            <button
              onClick={() => run(() => screenApplication(app.id))}
              disabled={busy}
              className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-bg transition-colors"
            >
              Screen now
            </button>
          </>
        )}
        <button
          onClick={() => run(() => toggleArchiveApplication(app.id))}
          disabled={busy}
          className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-bg transition-colors"
        >
          Archive
        </button>
        <button
          onClick={() => {
            if (confirm(`Remove ${app.candidateName} from the pipeline? This can't be undone.`)) {
              run(() => removeApplication(app.id));
            }
          }}
          disabled={busy}
          className="text-xs border border-red text-red rounded-lg px-3 py-1.5 hover:bg-red/10 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}