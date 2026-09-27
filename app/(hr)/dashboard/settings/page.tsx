"use client";

import { useEffect, useState } from "react";
import {
  getCompanySettings,
  updateCompanySettings,
  uploadCompanyLogo,
  getCompanyLogoUrl,
  testCustomAgent,
} from "@/lib/api";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [hasLogo, setHasLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [agentMode, setAgentMode] = useState<"cruwo" | "custom">("cruwo");
  const [customAgentUrl, setCustomAgentUrl] = useState("");
  const [customAgentKey, setCustomAgentKey] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCompanySettings().then((s) => {
      setCompanyName(s.companyName);
      setCompanyDescription(s.companyDescription ?? "");
      setHasLogo(!!s.companyLogoPath);
      setAgentMode((s.agentMode as "cruwo" | "custom") ?? "cruwo");
      setCustomAgentUrl(s.customAgentUrl ?? "");
      setHasExistingKey(s.hasCustomAgentKey);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateCompanySettings({
        companyName,
        companyDescription,
        agentMode,
        customAgentUrl,
        customAgentKey, // empty string means "keep existing key" — backend handles this
      });
      if (customAgentKey) setHasExistingKey(true);
      setCustomAgentKey("");
      setSaved(true);
      setTestResult(null);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      await uploadCompanyLogo(logoFile);
      setHasLogo(true);
      setLogoFile(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleTestAgent = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testCustomAgent();
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-muted">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-2">Company settings</h1>
      <p className="text-muted text-sm mb-8">
        Used by the job-posting agent, and shown to candidates on job listings.
      </p>

      <div className="mb-8 pb-8 border-b border-border">
        <label className="font-mono text-[10px] text-muted tracking-wide block mb-3">
          COMPANY LOGO
        </label>
        <div className="flex items-center gap-4">
          {hasLogo ? (
            <img
              src={`${getCompanyLogoUrl()}?t=${Date.now()}`}
              alt="Company logo"
              className="w-16 h-16 rounded-lg object-cover border border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg border border-border bg-bg flex items-center justify-center text-muted text-xs">
              None
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="text-xs text-muted file:mr-3 file:border-0 file:bg-surface file:text-text file:rounded file:px-2 file:py-1"
            />
            {logoFile && (
              <button
                onClick={handleLogoUpload}
                disabled={uploadingLogo}
                className="font-display text-xs font-medium bg-amber text-[#1A1204] rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 self-start"
              >
                {uploadingLogo ? "Uploading..." : "Upload logo"}
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
            COMPANY NAME
          </label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. BolaTek Innovations"
            className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
            ABOUT THE COMPANY
          </label>
          <textarea
            rows={4}
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            placeholder="A few sentences about what the company does."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
          />
        </div>

        <div className="border-t border-border pt-5 mt-1">
          <label className="font-mono text-[10px] text-muted tracking-wide block mb-3">
            SCREENING AGENT
          </label>
          <p className="text-xs text-muted mb-4">
            Applies to every job — Cruwo&apos;s own agent by default, or your own screening service.
          </p>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setAgentMode("cruwo")}
              className={`font-display text-xs font-medium rounded-lg px-3 py-2 transition-colors ${
                agentMode === "cruwo" ? "bg-amber text-[#1A1204]" : "border border-border text-muted hover:text-text"
              }`}
            >
              Use Cruwo&apos;s agent
            </button>
            <button
              type="button"
              onClick={() => setAgentMode("custom")}
              className={`font-display text-xs font-medium rounded-lg px-3 py-2 transition-colors ${
                agentMode === "custom" ? "bg-amber text-[#1A1204]" : "border border-border text-muted hover:text-text"
              }`}
            >
              Use our own agent
            </button>
          </div>

          {agentMode === "custom" && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
                  AGENT ENDPOINT URL
                </label>
                <input
                  value={customAgentUrl}
                  onChange={(e) => setCustomAgentUrl(e.target.value)}
                  placeholder="https://your-agent.example.com/screen"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
                  API KEY {hasExistingKey && "(configured — leave blank to keep it)"}
                </label>
                <input
                  type="password"
                  value={customAgentKey}
                  onChange={(e) => setCustomAgentKey(e.target.value)}
                  placeholder={hasExistingKey ? "••••••••••••" : ""}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
                />
              </div>
              <p className="text-xs text-muted">
                Your agent must accept {"{cv_text, job_requirements, custom_answers}"} and return {"{score, reason, recommendation}"}.
              </p>
              <button
                type="button"
                onClick={handleTestAgent}
                disabled={testing || !customAgentUrl}
                className="text-sm border border-border rounded-lg px-4 py-2 hover:bg-bg transition-colors disabled:opacity-50 self-start"
              >
                {testing ? "Testing..." : "Run test"}
              </button>
              {testResult && (
                <p className={`text-sm ${testResult.success ? "text-green" : "text-red"}`}>
                  {testResult.message}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 self-start"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
        {saved && <p className="text-green text-sm">Saved.</p>}
      </form>
    </div>
  );
}