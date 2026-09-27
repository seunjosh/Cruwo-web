"use client";

import { useEffect, useState } from "react";
import { getMyCandidateAccount } from "@/lib/api";
import { TwinChat } from "@/components/candidate/twin-chat";

export default function MyTwinPage() {
  const [candidate, setCandidate] = useState<{ candidateId: number; email: string } | null>(null);

  useEffect(() => {
    getMyCandidateAccount().then(setCandidate);
  }, []);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-2">My digital twin</h1>
      <p className="text-muted text-sm mb-8">
        This is exactly what a recruiter sees and can chat with — grounded entirely in your profile.
        Keep your profile up to date so it answers well.
      </p>
      {candidate && <TwinChat candidateId={candidate.candidateId} candidateName={candidate.email} />}
    </div>
  );
}