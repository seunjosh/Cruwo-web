import Link from "next/dist/client/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
  <img src="/Cruwo-logo.svg" alt="Cruwo" className="h-8" />
</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display text-2xl font-bold mb-6">How we handle your application</h1>

        <div className="flex flex-col gap-6 text-sm text-muted leading-relaxed">
          <div>
            <h2 className="font-display text-base font-medium text-text mb-2">What we collect</h2>
            <p>Your name, email address, CV, and any answers you provide in a guided application form.</p>
          </div>
          <div>
            <h2 className="font-display text-base font-medium text-text mb-2">How it&apos;s used</h2>
            <p>
              Your CV and application details are reviewed by an AI agent, which reads your CV,
              compares it against the role&apos;s requirements, and produces a match score and a
              short written reason. This automated screening informs — but does not replace — the
              hiring decision. A human reviews every shortlist before any interview invitation is sent.
            </p>
          </div>
          <div>
            <h2 className="font-display text-base font-medium text-text mb-2">How long we keep it</h2>
            <p>
              Your application is kept for as long as the role remains active, or until you request
              its removal. You can request removal at any time by contacting the hiring team.
            </p>
          </div>
          <div>
            <h2 className="font-display text-base font-medium text-text mb-2">Your rights</h2>
            <p>
              You can ask to see what information we hold about your application, or ask for it to
              be deleted, at any time.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}