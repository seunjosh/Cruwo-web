"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getOpenJobs, submitApplication, type Job } from "@/lib/api";

function QuickApplyForm() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("jobId");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState(preselectedJobId ?? "");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
const source = searchParams.get("source") ?? "direct";
  useEffect(() => {
    getOpenJobs().then(setJobs);
  }, []);
const [consent, setConsent] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cv || !jobId) return;
    setSubmitting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("candidateName", candidateName);
    formData.append("candidateEmail", candidateEmail);
    formData.append("jobId", jobId);
    formData.append("applicationMethod", "quick");
    formData.append("cv", cv);
    formData.append("source", source);
    formData.append("consent", String(consent));
    try {
      const res = await submitApplication(formData);
      if (res.warning) {
        setResult(`Application received. ${res.warning}`);
      } else if (res.score != null) {
        setResult(`Application submitted and screened. Score: ${res.score}`);
      } else {
        setResult(`Application received. Status: ${res.status}`);
      }
      setCandidateName("");
      setCandidateEmail("");
      setCv(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-xl font-bold mb-3">Thanks for applying</h1>
          <p className="text-muted text-sm">{result}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl font-bold mb-1">Quick apply</h1>
        <p className="text-muted text-sm mb-8">
          Just drop your CV. The agent reads everything else from it.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">FULL NAME</label>
            <input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">EMAIL</label>
            <input
              type="email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">ROLE</label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            >
              <option value="">Select a role</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>

                
              ))}

              {jobId && jobs.find((j) => String(j.id) === jobId) && (
  <div className="rounded-lg border border-border bg-surface p-4 -mt-2">
    <p className="text-sm text-muted leading-relaxed">
      {jobs.find((j) => String(j.id) === jobId)?.description}
    </p>
  </div>
)}
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">CV (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setCv(e.target.files?.[0] ?? null)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm file:mr-3 file:border-0 file:bg-bg file:text-text file:rounded file:px-2 file:py-1"
            />
          </div>
          {error && <p className="text-red text-sm">{error}</p>}
          <label className="flex items-start gap-2.5 cursor-pointer">
  <input
    type="checkbox"
    checked={consent}
    onChange={(e) => setConsent(e.target.checked)}
    required
    className="w-4 h-4 mt-0.5 accent-amber shrink-0"
  />
  <span className="text-xs text-muted leading-relaxed">
    I consent to my CV and application details being processed, including automated
    screening by an AI agent, for this recruitment process. A human reviews any shortlist
    before interview invitations are sent. See our{" "}
    <a href="/privacy" target="_blank" className="text-amber underline">
      privacy notice
    </a>.
  </span>
</label>
          <button
            type="submit"
            disabled={submitting || !consent}
            className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {submitting ? "Submitting..." : "Submit application"}
          </button>
        </form>
      </div>
    </div>
  );
}

// useSearchParams requires a Suspense boundary in the App Router — this
// wrapper satisfies that without needing to restructure the page.
export default function QuickApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <QuickApplyForm />
    </Suspense>
  );
}