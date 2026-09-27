import { getOpenJobs, getCompanyLogoUrl, API_URL } from "@/lib/api";
import { CareersList } from "@/components/candidate/careers-list";
import Link from "next/dist/client/link";

// Checks whether a logo actually exists before trying to render it, since
// the backend returns 404 if none was uploaded — avoids a broken image icon.
async function checkLogoExists(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/settings/logo`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function CareersPage() {
  const [jobs, hasLogo] = await Promise.all([getOpenJobs(), checkLogoExists()]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          {hasLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getCompanyLogoUrl()} alt="" className="w-8 h-8 rounded object-cover" />
          )}


          <Link href="/" className="flex items-center gap-3">
  {hasLogo && <img src={getCompanyLogoUrl()} alt="" className="w-8 h-8 rounded object-cover" />}
  <img src="/Cruwo-logo.svg" alt="Cruwo" className="h-6" />
</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-bold mb-2">Open roles</h1>
        <p className="text-muted mb-10">
          Browse current openings. Click a role to see the full description
          before applying.
        </p>
        <CareersList jobs={jobs} />
      </main>
    </div>
  );
}