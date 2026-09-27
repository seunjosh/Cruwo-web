"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getOpenJobs, submitApplication, type Job, type FormField } from "@/lib/api";

function GuidedApplyForm() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("jobId");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState(preselectedJobId ?? "");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
const source = searchParams.get("source") ?? "direct";


  useEffect(() => {
    getOpenJobs().then(setJobs);
  }, []);

  const selectedJob = jobs.find((j) => String(j.id) === jobId) as (Job & { applicationForm?: string | null }) | undefined;

  let formFields: FormField[] = [];
  try {
    formFields = selectedJob?.applicationForm ? JSON.parse(selectedJob.applicationForm) : [];
  } catch {
    formFields = [];
  }

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
    formData.append("applicationMethod", "guided");
    formData.append("cv", cv);
    formData.append("source", source);
    // Custom answers travel as one JSON blob, keyed by each field's id —
    // matches what the backend expects and stores on the application.
    formData.append("customAnswers", JSON.stringify(answers));

    try {
      const res = await submitApplication(formData);
      if (res.warning) {
        setResult(`Application received. ${res.warning}`);
      } else if (res.score != null) {
        setResult(`Application submitted and screened. Score: ${res.score}`);
      } else {
        setResult(`Application received. Status: ${res.status}`);
      }
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
        <h1 className="font-display text-2xl font-bold mb-1">Guided application</h1>
        <p className="text-muted text-sm mb-8">
          A few questions plus your CV. The agent checks your answers against what&apos;s actually in the CV.
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
            </select>
          </div>

          {selectedJob?.description && (
            <div className="rounded-lg border border-border bg-surface p-4 -mt-2">
              <p className="text-sm text-muted leading-relaxed">{selectedJob.description}</p>
            </div>
          )}

          {/* Dynamic questions — rendered from this job's applicationForm,
              defined by HR when the job was posted. */}
          {formFields.map((field) => (
            <div key={field.id}>
              <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
                {field.label.toUpperCase()}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  rows={3}
                  required={field.required}
                  value={answers[field.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
                />
              ) : field.type === "select" ? (
                <select
                  required={field.required}
                  value={answers[field.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === "yesno" ? (
                <select
                  required={field.required}
                  value={answers[field.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : (
                <input
                  type={field.type === "number" ? "number" : "text"}
                  required={field.required}
                  value={answers[field.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
                />
              )}
            </div>
          ))}

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
          <button
            type="submit"
            disabled={submitting}
            className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {submitting ? "Submitting..." : "Submit application"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GuidedApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <GuidedApplyForm />
    </Suspense>
  );
}