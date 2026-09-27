"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Job } from "@/lib/api";

export function CareersList({ jobs }: { jobs: Job[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (jobs.length === 0) {
    return <p className="text-muted">No open roles right now.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job) => {
        const isExpanded = expandedId === job.id;

        // requirements is stored as a JSON-encoded string by the backend —
        // parse it defensively in case a job was created without any.
        let requirements: string[] = [];
        try {
          requirements = job.requirements ? JSON.parse(job.requirements) : [];
        } catch {
          requirements = [];
        }

        return (
          <div key={job.id} className="rounded-xl border border-border bg-surface">
            <button
              onClick={() => setExpandedId(isExpanded ? null : job.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-display font-medium">{job.title}</span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {isExpanded && (
              <div className="px-5 pb-5 border-t border-border pt-4">
                <p className="text-sm text-text mb-4 leading-relaxed">
                  {job.description}
                </p>
                {requirements.length > 0 && (
                  <>
                    <span className="font-mono text-[10px] text-muted tracking-wide">
                      REQUIREMENTS
                    </span>
                    <ul className="mt-2 mb-5 flex flex-col gap-1.5">
                      {requirements.map((r, i) => (
                        <li key={i} className="text-sm text-muted">
                          · {r}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="flex gap-3">
                  <Link
                    href={`/apply/quick?jobId=${job.id}`}
                    className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
                  >
                    Quick Apply
                  </Link>
                  <Link
                    href={`/apply/guided?jobId=${job.id}`}
                    className="font-display text-sm font-medium border border-border rounded-lg px-4 py-2 hover:bg-bg transition-colors"
                  >
                    Guided Application
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}