"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateJobDraft, createJob, getFormTemplates, type JobDraft, type FormTemplate, type FormField } from "@/lib/api";

export default function PostJobPage() {
  const router = useRouter();

  // Whether the recruiter wants the agent to draft, or is writing it themselves.
  const [mode, setMode] = useState<"agent" | "manual">("agent");

  // Step 1 inputs — keywords the agent drafts from (agent mode only)
  const [role, setRole] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [level, setLevel] = useState("");
  const [team, setTeam] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  // Saved form templates, for the guided-application dropdown below.
  const [templates, setTemplates] = useState<FormTemplate[]>([]);

  useEffect(() => {
    getFormTemplates().then(setTemplates);
  }, []);


  const [expiresAt, setExpiresAt] = useState("");
  // The job content itself — filled by the agent's draft, or typed
  // directly in manual mode. Same fields either way.
  const [draft, setDraft] = useState<JobDraft | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualRequirements, setManualRequirements] = useState("");

  const [useGuidedForm, setUseGuidedForm] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);

  // Job settings — shared by both modes
  const [shortlistTarget, setShortlistTarget] = useState("");
  const [onTargetReached, setOnTargetReached] = useState("pause");
  const [autoScreen, setAutoScreen] = useState(true);

  const [drafting, setDrafting] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrafting(true);
    setError(null);
    try {
      const generated = await generateJobDraft({ role, yearsExperience, level, team, extraNotes });
      setDraft(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDrafting(false);
    }
  };

  // In manual mode, "drafting" just means moving to the review/settings
  // step directly with whatever the recruiter typed — no agent call at all.
  const handleManualContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualRequirements) return;
    setDraft({
      title: manualTitle,
      description: manualDescription,
      requirements: manualRequirements.split("\n").filter(Boolean),
    });
  };

  const handleConfirmPost = async () => {
    if (!draft) return;
    setPosting(true);
    setError(null);
    try {
      await createJob({
        ...draft,
        shortlistTarget,
        onTargetReached,
        autoScreen,
        applicationForm: useGuidedForm ? formFields : null,
        expiresAt: expiresAt || null
      });
      router.push("/dashboard/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  // --- Step 2: review/edit whatever content exists (agent-drafted or manual) + settings ---
  if (draft) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="font-display text-2xl font-bold mb-2">
          {mode === "agent" ? "Review the draft" : "Review your posting"}
        </h1>
        <p className="text-muted text-sm mb-8">
          {mode === "agent"
            ? "The agent wrote this from your keywords. Edit anything, set how this job should run, then post it."
            : "Set how this job should run, then post it."}
        </p>

        <div className="flex flex-col gap-5">
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">TITLE</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">DESCRIPTION</label>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
              REQUIREMENTS (one per line)
            </label>
            <textarea
              rows={6}
              value={draft.requirements.join("\n")}
              onChange={(e) =>
                setDraft({ ...draft, requirements: e.target.value.split("\n").filter(Boolean) })
              }
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>

          <div className="border-t border-border pt-5">
            <p className="font-mono text-[10px] text-amber tracking-wide mb-4">JOB SETTINGS</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
                  SHORTLIST TARGET (OPTIONAL)
                </label>
                <input
                  type="number"
                  min={1}
                  value={shortlistTarget}
                  onChange={(e) => setShortlistTarget(e.target.value)}
                  placeholder="e.g. 5 — leave blank for unlimited"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
                  WHEN THE TARGET IS REACHED
                </label>
                <select
                  value={onTargetReached}
                  onChange={(e) => setOnTargetReached(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
                >
                  <option value="pause">Pause — stop new applications, notify me right away</option>
                  <option value="collect">Keep collecting — build a larger pool, I&apos;ll decide when to stop</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScreen}
                  onChange={(e) => setAutoScreen(e.target.checked)}
                  className="w-4 h-4 accent-amber"
                />
                <span className="text-sm">
                  Auto-screen candidates as they apply
                  <span className="block text-muted text-xs mt-0.5">
                    Off means candidates stay unscored until you trigger screening manually
                  </span>
                </span>
              </label>
            </div>
          </div>
<div>
  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
    EXPIRES ON (OPTIONAL)
  </label>
  <input
    type="date"
    value={expiresAt}
    onChange={(e) => setExpiresAt(e.target.value)}
    className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
  />
  <p className="text-xs text-muted mt-1">Job auto-archives after this date. Leave blank to keep it open indefinitely.</p>
</div>
          <div className="border-t border-border pt-5 mt-2">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={useGuidedForm}
                onChange={(e) => setUseGuidedForm(e.target.checked)}
                className="w-4 h-4 accent-amber"
              />
              <span className="text-sm">
                Add a guided application form
                <span className="block text-muted text-xs mt-0.5">
                  Candidates answer these questions alongside uploading their CV
                </span>
              </span>
            </label>
            {useGuidedForm && (
              <div>
                <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
                  APPLICATION FORM
                </label>
                <select
                  onChange={(e) => {
                    const template = templates.find((t) => String(t.id) === e.target.value);
                    if (template) setFormFields(JSON.parse(template.fields));
                  }}
                  defaultValue=""
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
                >
                  <option value="" disabled>Choose a form...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-xs text-muted mt-2">
                    No forms yet —{" "}
                    <a href="/dashboard/forms" className="text-amber underline">create one</a>.
                  </p>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-red text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleConfirmPost}
              disabled={posting}
              className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {posting ? "Posting..." : "Confirm & Post"}
            </button>
            <button
              onClick={() => setDraft(null)}
              className="font-display text-sm font-medium border border-border rounded-lg px-5 py-2.5 hover:bg-surface transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 1: choose agent vs manual, then the matching form ---
  return (
    <div className="p-8 max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-2">Post a job</h1>
      <p className="text-muted text-sm mb-6">
        Have the agent draft the posting from a few keywords, or write it yourself.
      </p>

      <div className="flex gap-2 mb-8 border border-border rounded-lg p-1 w-fit">
        <button
          onClick={() => setMode("agent")}
          className={`font-display text-xs font-medium rounded px-3 py-1.5 transition-colors ${
            mode === "agent" ? "bg-amber text-[#1A1204]" : "text-muted hover:text-text"
          }`}
        >
          Agent drafts it
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`font-display text-xs font-medium rounded px-3 py-1.5 transition-colors ${
            mode === "manual" ? "bg-amber text-[#1A1204]" : "text-muted hover:text-text"
          }`}
        >
          I&apos;ll write it
        </button>
      </div>

      {mode === "agent" ? (
        <form onSubmit={handleGenerateDraft} className="flex flex-col gap-4">
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">ROLE</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Engineer"
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
              YEARS OF EXPERIENCE
            </label>
            <input
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="e.g. 2"
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
              LEVEL (OPTIONAL)
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            >
              <option value="">Not specified</option>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">TEAM</label>
            <input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. Frontend"
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
              ANYTHING ELSE? (OPTIONAL)
            </label>
            <input
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="e.g. must know Rust"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          {error && <p className="text-red text-sm">{error}</p>}
          <button
            type="submit"
            disabled={drafting}
            className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {drafting ? "Drafting..." : "Generate draft"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleManualContinue} className="flex flex-col gap-4">
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">TITLE</label>
            <input
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">DESCRIPTION</label>
            <textarea
              rows={4}
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
              REQUIREMENTS (one per line)
            </label>
            <textarea
              rows={6}
              value={manualRequirements}
              onChange={(e) => setManualRequirements(e.target.value)}
              placeholder={"Python\n3+ years experience\nAWS"}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <button
            type="submit"
            className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity mt-2"
          >
            Continue
          </button>
        </form>
      )}
    </div>
  );
}