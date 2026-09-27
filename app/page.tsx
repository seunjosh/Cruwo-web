import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

import {
  GitBranch,
  FileText,
  Mail,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

// A small reusable pipe-stage dot, reused from the actual product UI's
// visual language — this is the same "pipeline run" concept a recruiter
// sees once they're logged in, so the marketing page and the product feel
// like one thing, not two different designs stitched together.
function StageDot({ variant }: { variant: "pass" | "active" | "pending" }) {
  const styles = {
    pass: "bg-green border-green",
    active: "bg-amber border-amber shadow-[0_0_0_4px_rgba(245,166,35,0.2)]",
    pending: "bg-muted/30 border-muted/30",
  };
  return <div className={`w-3 h-3 rounded-full border-2 ${styles[variant]}`} />;
}

// The hero's centerpiece: a miniature version of the actual pipeline
// tracker candidates move through in the product. Doubles as an honest
// preview of what the tool looks like, not a stock illustration.
function HeroPipelinePreview() {
  const stages: { label: string; variant: "pass" | "active" | "pending" }[] = [
    { label: "APPLIED", variant: "pass" },
    { label: "EXTRACTED", variant: "pass" },
    { label: "SCORED", variant: "active" },
    { label: "SHORTLISTED", variant: "pending" },
  ];

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-sm font-medium">Jordan A. Reyes</span>
        <span className="font-mono text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
          QUICK
        </span>
      </div>
      <div className="flex items-center">
        {stages.map((stage, i) => (
          <div key={stage.label} className="contents">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <StageDot variant={stage.variant} />
              <span className="font-mono text-[9px] text-muted tracking-wide">
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`h-0.5 flex-[2] -mt-4 ${
                  stage.variant === "pass" ? "bg-green" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="font-mono text-[11px] text-muted mt-4">
        Strong SRE background across AWS, Azure, and GCP — matches every
        requirement.
      </p>
    </div>
  );
}

// One card in the "how it works" section — each of Cruwo's three agents.
function AgentCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="w-10 h-10 rounded-lg bg-amber/10 border border-amber/30 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-amber" />
      </div>
      <h3 className="font-display text-base font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}

// One line in the HR features list.
function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-green shrink-0 mt-0.5" />
      <span className="text-sm text-text">{text}</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* --- Nav --- */}
      <header className="border-b border-border">
  <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <div className="flex items-center gap-2">
         <Link href="/" className="flex items-center gap-2">
  <img src="/Cruwo-logo.svg" alt="Cruwo" className="h-8" />
</Link>
      <span className="font-mono text-[10px] text-amber border border-amber/30 bg-amber/10 rounded px-1.5 py-0.5">
        AGENT-DRIVEN
      </span>
    </div>
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <Link href="/signin" className="font-display text-sm font-medium text-muted hover:text-text transition-colors">
        Sign in
      </Link>
      <Link
        href="/join"
        className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
      >
        Join Cruwo
      </Link>
    </div>
  </div>
</header>

      {/* --- Hero --- */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
            Hiring, run as a pipeline.
          </h1>
          <p className="text-muted text-lg leading-relaxed mb-8">
            Cruwo screens every candidate, drafts your job postings, and writes
            the interview invitations — three Gemini agents doing the real work
            of hiring, with a human always confirming the final call.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/careers"
              className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-5 py-3 hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              See it in action <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="font-display text-sm font-medium border border-border rounded-lg px-5 py-3 hover:bg-surface transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <HeroPipelinePreview />
        </div>
      </section>

      {/* --- The problem --- */}
      <section className="border-y border-border bg-surface/40">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="font-mono text-xs text-amber mb-3 tracking-wide">
            THE PROBLEM
          </p>
          <h2 className="font-display text-2xl font-medium mb-4">
            Most hiring tools stop at the score.
          </h2>
          <p className="text-muted leading-relaxed">
            Everything after screening — compiling a shortlist, deciding
            who's ready, writing the interview invite — is still manual
            work. Cruwo automates the whole loop, not just the scoring step.
          </p>
        </div>
      </section>

      {/* --- How it works / the three agents --- */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <p className="font-mono text-xs text-amber mb-3 tracking-wide text-center">
          HOW IT WORKS
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-12 text-center">
          Three agents, one hiring workflow
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <AgentCard
            icon={FileText}
            title="Drafts the job posting"
            description="Give it a role, years of experience, and a team — it writes the full title, description, and requirements for you to review before it goes live."
          />
          <AgentCard
            icon={GitBranch}
            title="Screens every candidate"
            description="Reads each CV, scores it against the role's requirements, and decides shortlist or reject — reasoning through the fit, not just matching keywords."
          />
          <AgentCard
            icon={Mail}
            title="Writes the invitation"
            description="Once you're ready to move forward, it drafts a personalized interview invite for each shortlisted candidate — you review and edit before anything sends."
          />
        </div>
      </section>

      {/* --- Features for HR --- */}
      <section className="border-t border-border bg-surface/40">
        <div className="max-w-5xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-xs text-amber mb-3 tracking-wide">
              FOR HR TEAMS
            </p>
            <h2 className="font-display text-2xl font-medium mb-6">
              You stay in control of every decision that matters.
            </h2>
            <div className="flex flex-col gap-4">
              <FeatureRow text="A live pipeline view of every candidate, from application to outcome" />
              <FeatureRow text="Set a shortlist target and choose what happens when it's hit — pause, or keep collecting a larger pool" />
              <FeatureRow text="Review every drafted interview invite before it's confirmed" />
              <FeatureRow text="Edit, archive, reopen, or report on any posted role" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 flex items-center justify-center">
            <div className="flex items-center gap-3 text-muted">
              <ShieldCheck className="w-6 h-6 text-green" />
              <span className="font-mono text-sm">
                Nothing gets sent without your confirmation.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Closing CTA --- */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <Users className="w-8 h-8 text-amber mx-auto mb-6" />
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
          Ready to see it run?
        </h2>
        <p className="text-muted mb-8">
          Browse the open roles Cruwo is actively screening for, and see the
          pipeline in action.
        </p>
        <Link
          href="/careers"
          className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-6 py-3 hover:opacity-90 transition-opacity inline-flex items-center gap-2"
        >
         
          View open roles <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
      


      {/* --- Footer --- */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-xs text-muted font-mono">
          Cruwo — a product by BolaTek Innovations
        </div>
      </footer>
    </div>
  );
}