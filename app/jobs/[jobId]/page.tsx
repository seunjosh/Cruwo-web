import Link from "next/link";
import { getOpenJobs } from "@/lib/api";

// A single job's public page — this is the URL you'd paste as the "Apply"
// destination on LinkedIn, Indeed, or anywhere else. Reads the ?source=
// param and forwards it into the apply links, so submissions can be
// traced back to which platform they came from.
export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { jobId } = await params;
  const { source } = await searchParams;
  const jobs = await getOpenJobs();
  const job = jobs.find((j) => String(j.id) === jobId);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-muted">This role is no longer accepting applications.</p>
      </div>
    );
  }

  let requirements: string[] = [];
  try {
    requirements = job.requirements ? JSON.parse(job.requirements) : [];
  } catch {
    requirements = [];
  }

  const sourceParam = source ? `&source=${encodeURIComponent(source)}` : "";

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="font-display font-bold text-lg">Cruwo</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-bold mb-4">{job.title}</h1>
        <p className="text-text mb-6 leading-relaxed">{job.description}</p>
        {requirements.length > 0 && (
          <>
            <span className="font-mono text-[10px] text-muted tracking-wide">REQUIREMENTS</span>
            <ul className="mt-2 mb-8 flex flex-col gap-1.5">
              {requirements.map((r, i) => (
                <li key={i} className="text-sm text-muted">· {r}</li>
              ))}
            </ul>
          </>
        )}
        <div className="flex gap-3">
          <Link
            href={`/apply/quick?jobId=${job.id}${sourceParam}`}
            className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity"
          >
            Quick Apply
          </Link>
          <Link
            href={`/apply/guided?jobId=${job.id}${sourceParam}`}
            className="font-display text-sm font-medium border border-border rounded-lg px-5 py-2.5 hover:bg-surface transition-colors"
          >
            Guided Application
          </Link>
        </div>
      </main>
    </div>
  );
}