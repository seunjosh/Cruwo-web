"use client";

import { useEffect, useState } from "react";
import { getTalentPool, type TalentPoolEntry } from "@/lib/api";

export default function TalentPoolPage() {
  const [candidates, setCandidates] = useState<TalentPoolEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTalentPool()
      .then((data) => {
        setCandidates(data);
      })
      .catch((error) => {
        console.error("Failed to load talent pool:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-muted">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-2">
        Talent pool
      </h1>

      <p className="text-muted text-sm mb-8">
        Every candidate who has built a profile — browse and chat with their
        digital twin, whether or not they've applied to a specific role.
      </p>

      {candidates.length === 0 ? (
        <p className="text-muted text-sm">
          No candidate profiles yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {candidates.map((c) => (
            <a
              key={c.id}
              href={`/candidates/${c.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border bg-surface p-5 flex items-center justify-between hover:border-amber/40 transition-colors"
            >
              <div>
                <p className="font-display font-medium">
                  {c.name}
                </p>

                <p className="text-sm text-muted">
                  {c.title || "No title set"}
                  {c.location && ` · ${c.location}`}
                </p>
              </div>

              <span className="font-mono text-[10px] text-amber">
                VIEW &amp; CHAT →
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}