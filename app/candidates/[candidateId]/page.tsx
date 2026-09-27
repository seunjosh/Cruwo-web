import { getPublicProfile, getCandidatePhotoUrl } from "@/lib/api";
import { TwinChat } from "@/components/candidate/twin-chat";
import { Avatar } from "@/components/candidate/avatar";

// The public candidate page is a server component that fetches the candidate's profile data and renders it. It also includes a chat interface for interacting with the candidate's digital twin, which is a client component.
export default async function PublicCandidatePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const profile = await getPublicProfile(candidateId);

  const parse = (json: string | null) => {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  };
  const experience = parse(profile.experience);
  const projects = parse(profile.projects);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <span className="font-display font-bold text-lg">Cruwo</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-[1fr_360px] gap-8">
        <div>
          <div className="flex items-center gap-4 mb-6">
               <Avatar src={getCandidatePhotoUrl(Number(candidateId))} name={profile.name} size={64} />  
            <div>
              <h1 className="font-display text-xl font-bold">{profile.name}</h1>
              <p className="text-sm text-muted">{profile.title}</p>
            </div>
          </div>

          {profile.overview && (
            <div className="mb-6">
              <h2 className="font-display text-base font-medium mb-2">Overview</h2>
              <p className="text-sm text-muted leading-relaxed">{profile.overview}</p>
            </div>
          )}

          {experience.length > 0 && (
            <div className="mb-6">
              <h2 className="font-display text-base font-medium mb-3">Experience</h2>
              <div className="flex flex-col gap-3">
                {experience.map((e: any, i: number) => (
                  <div key={i} className="pb-3 border-b border-border last:border-0">
                    <p className="text-sm font-medium">{e.title} — {e.company}</p>
                    <p className="text-xs text-muted mb-1">{e.duration}</p>
                    <p className="text-sm text-muted">{e.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h2 className="font-display text-base font-medium mb-3">Projects</h2>
              <div className="flex flex-col gap-3">
                {projects.map((p: any, i: number) => (
                  <div key={i} className="pb-3 border-b border-border last:border-0">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-sm text-muted">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <TwinChat candidateId={Number(candidateId)} candidateName={profile.name} />
      </main>
    </div>
  );
}