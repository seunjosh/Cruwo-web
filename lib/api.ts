// Central place for talking to the existing Express backend. Keeping the
// base URL and types here means every page imports from one source
// instead of hardcoding "http://localhost:4000" everywhere.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";




// Server Components (layouts, etc.) run in Node, which can't resolve a
// relative URL like the browser can — so they need the real, absolute
// backend URL. BACKEND_URL (no NEXT_PUBLIC_ prefix, so it's never sent
// to the browser) provides that; it falls back to API_URL for local dev,
// where API_URL is already an absolute localhost URL anyway.
export const SERVER_API_URL = process.env.BACKEND_URL ?? API_URL;


export type Job = {
  id: number;
  title: string;
  description: string;
  requirements: string; // JSON-encoded string array, as stored by the backend
  status: string;
  applicationForm?: string | null;
};

// Every call to the backend needs credentials: "include" so the browser
// sends the session cookie — without this, an HR user would appear
// logged out on every authenticated request even right after logging in.
export async function apiFetch(path: string, options: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
  });
}


// Fetches every open job. `cache: "no-store"` means Next.js always gets
// fresh data instead of caching the response — right for a job board
// where listings can change (a job can close between page loads).
export async function getOpenJobs(): Promise<Job[]> {
  const res = await fetch(`${API_URL}/jobs`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load jobs");
  const jobs: (Job & { archived?: boolean })[] = await res.json();
  return jobs.filter((j) => j.status === "open" && !j.archived);
}

export type JobDraft = {
  title: string;
  description: string;
  requirements: string[];
};

// Asks the job-posting agent to draft a full posting from a few keywords.
// Nothing is saved yet — this just returns a draft to review.
export async function generateJobDraft(input: {
  role: string;
  yearsExperience: string;
  level: string;
  team: string;
  extraNotes: string;
}): Promise<JobDraft> {
  const res = await apiFetch("/jobs/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Could not generate draft");
  return res.json();
}

// Actually creates the job posting, including the settings HR configured
// alongside the agent's draft content.
export async function createJob(input: {
  title: string;
  description: string;
  requirements: string[];
  shortlistTarget: string;
  onTargetReached: string;
  autoScreen: boolean;
  applicationForm?: FormField[] | null;
  agentMode?: string;
  customAgentUrl?: string;
  customAgentKey?: string;
  expiresAt?: string | null;
}) {
  const res = await apiFetch("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      shortlistTarget: input.shortlistTarget || null,
    }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Could not post job");
  return res.json();
}


export type JobFull = Job & {
  shortlistTarget: number | null;
  onTargetReached: string;
  autoScreen: boolean;
  archived: boolean;
  createdAt: string; 
  expiresAt?: string | null;

};

// All jobs, including archived ones — Manage Jobs needs the full picture,
// unlike the public Careers page which only shows open roles.
export async function getAllJobs(): Promise<JobFull[]> {
  const res = await apiFetch("/jobs");
  if (!res.ok) throw new Error("Failed to load jobs");
  return res.json();
}

export async function updateJob(
  jobId: number,
  input: {
    title?: string;
    description?: string;
    requirements?: string[];
    shortlistTarget?: string | null;
    onTargetReached?: string;
    autoScreen?: boolean;
  }
) {
  const res = await apiFetch(`/jobs/${jobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
  return res.json();
}

export async function toggleArchiveJob(jobId: number) {
  const res = await apiFetch(`/jobs/${jobId}/archive`, { method: "PATCH" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Archive failed");
  return res.json();
}

export async function reopenJob(jobId: number) {
  const res = await apiFetch(`/jobs/${jobId}/reopen`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Reopen failed");
  return res.json();
}

export async function deleteJob(jobId: number) {
  const res = await apiFetch(`/jobs/${jobId}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
}

// Used to build the per-job report — total applications and their outcomes.
export type Application = {
  id: number;
  jobId: number;
  candidateName: string;
  status: string;
  score: number | null;
};

export async function getAllApplications(): Promise<Application[]> {
  const res = await apiFetch("/applications?includeArchived=true");
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
}

export type PipelineApplication = {
  id: number;
  candidateName: string;
  candidateEmail: string;
  jobId: number;
  score: number | null;
  scoreReason: string | null;
  status: string;
  applicationMethod?: "quick" | "guided";
  archived: boolean;
  assignedToId?: number | null;
  candidateId?: number | null;
};

export async function getApplications(): Promise<PipelineApplication[]> {
  const res = await apiFetch("/applications");
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
}

export async function retryScoring(applicationId: number) {
  const res = await apiFetch(`/applications/${applicationId}/retry-score`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Retry failed");
  return res.json();
}

export async function screenApplication(applicationId: number) {
  const res = await apiFetch(`/applications/${applicationId}/screen`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Screening failed");
  return res.json();
}

export async function toggleArchiveApplication(applicationId: number) {
  const res = await apiFetch(`/applications/${applicationId}/archive`, { method: "PATCH" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Archive failed");
  return res.json();
}

export async function removeApplication(applicationId: number) {
  const res = await apiFetch(`/applications/${applicationId}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Remove failed");
}


// Submits an application — multipart/form-data since a CV file is
// involved. Note: no Content-Type header set manually — the browser sets
// the correct multipart boundary automatically when you pass a FormData
// body directly.
export async function submitApplication(formData: FormData) {
  const res = await fetch(`${API_URL}/applications`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Application failed");
  return data as { status: string; score?: number; warning?: string };
}

export type CompanySettings = {
  id: number;
  companyName: string;
  companyDescription: string | null;
  companyLogoPath: string | null;
  agentMode: string;
  customAgentUrl: string | null;
  hasCustomAgentKey: boolean;
  updatedAt: string;
};

export async function deleteFormTemplate(id: number) {
  const res = await apiFetch(`/templates/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Could not delete template");
}


export async function getCompanySettings(): Promise<CompanySettings> {
  const res = await apiFetch("/settings");
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}



export async function updateCompanySettings(input: {
  companyName: string;
  companyDescription: string;
  agentMode?: string;
  customAgentUrl?: string;
  customAgentKey?: string;
}): Promise<CompanySettings> {
  const res = await apiFetch("/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
  return res.json();
}

export async function uploadCompanyLogo(file: File) {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await apiFetch("/settings/logo", { method: "POST", body: formData });
  if (!res.ok) throw new Error((await res.json()).error ?? "Logo upload failed");
  return res.json();
}

// The logo is served by the backend as a raw file, so the frontend just
// needs its URL — no need to fetch and re-encode it separately.
export function getCompanyLogoUrl() {
  return `${API_URL}/settings/logo`;
}

export type PendingReviewJob = Job & {
  status: string;
  invitedAt?: string | null;
};

export type ShortlistedCandidate = {
  id: number;
  candidateName: string;
  candidateEmail: string;
  score: number | null;
  scoreReason: string | null;
  status: string;
  interviewEmailSubject?: string | null;
  interviewEmailBody?: string | null;
 candidateId?: number | null;
  
};

export async function getPendingReviewJobs(): Promise<PendingReviewJob[]> {
  const res = await apiFetch("/jobs/pending-review");
  if (!res.ok) throw new Error("Failed to load pending review jobs");
  return res.json();
}

export async function getShortlist(jobId: number): Promise<ShortlistedCandidate[]> {
  const res = await apiFetch(`/applications/shortlist/${jobId}`);
  if (!res.ok) throw new Error("Failed to load shortlist");
  return res.json();
}

export function getCvUrl(applicationId: number) {
  return `${API_URL}/applications/${applicationId}/cv`;
}

export async function draftInvites(jobId: number, interviewDate: string): Promise<ShortlistedCandidate[]> {
  const res = await apiFetch(`/jobs/${jobId}/draft-invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewDate }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Could not draft invites");
  return res.json();
}

export async function confirmInvites(
  jobId: number,
  invites: { applicationId: number; subject: string; body: string }[]
) {
  const res = await apiFetch(`/jobs/${jobId}/confirm-invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invites }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Could not send invites");
  return res.json();
}

export async function stopProcess(jobId: number) {
  const res = await apiFetch(`/jobs/${jobId}/stop-process`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Could not stop process");
  return res.json();
}

export async function getInvitedJobs(): Promise<PendingReviewJob[]> {
  const res = await apiFetch("/jobs/invited");
  if (!res.ok) throw new Error("Failed to load invited jobs");
  return res.json();
}


export type FormField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "yesno";
  required: boolean;
  options?: string[]; // only for type "select"
};

export type FormTemplate = {
  id: number;
  name: string;
  fields: string; // JSON-encoded FormField[]
};

export async function getFormTemplates(): Promise<FormTemplate[]> {
  const res = await apiFetch("/templates");
  if (!res.ok) throw new Error("Failed to load templates");
  return res.json();
}

export async function saveFormTemplate(name: string, fields: FormField[]) {
  const res = await apiFetch("/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, fields }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Could not save template");
  return res.json();
}



export type JobWithForm = Job & { applicationForm: string | null };

export async function getJobById(jobId: string): Promise<JobWithForm> {
  const jobs = await getAllJobs();
  const job = jobs.find((j) => String(j.id) === jobId);
  if (!job) throw new Error("Job not found");
  return job as JobWithForm;
}



export type DashboardStats = {
  openJobs: number;
  pendingReview: number;
  totalApplications: number;
  shortlisted: number;
  invited: number;
};

// Builds the overview entirely from data already exposed by existing
// endpoints — no new backend route needed, just combining what's there.
export async function getDashboardStats(): Promise<DashboardStats> {
  const [jobs, applications, pendingReview] = await Promise.all([
    getAllJobs(),
    getAllApplications(),
    getPendingReviewJobs(),
  ]);

  return {
    openJobs: jobs.filter((j) => j.status === "open" && !j.archived).length,
    pendingReview: pendingReview.filter((j) => j.status === "pending_review").length,
    totalApplications: applications.length,
    shortlisted: applications.filter((a) => a.status === "shortlisted").length,
    invited: applications.filter((a) => a.status === "invited").length,
  };
}



export type SimpleUser = { id: number; name: string; email: string };

export async function getUsers(): Promise<SimpleUser[]> {
  const res = await apiFetch("/users");
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

export type AgentSettings = {
  agentMode: "cruwo" | "custom";
  customAgentUrl: string;
  customAgentKey: string;
};

export type AgentTestResult = { success: boolean; message: string; raw?: unknown };

export async function testCustomAgent(): Promise<AgentTestResult> {
  const res = await apiFetch("/settings/test-agent", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Test failed");
  return data;
}

export async function logout() {
  await apiFetch("/auth/logout", { method: "POST" });
}


export type ExperienceEntry = { title: string; company: string; duration: string; description: string };
export type ProjectEntry = { name: string; description: string; link?: string };
export type CertificationEntry = { name: string; issuer: string; year: string };
export type EducationEntry = { school: string; degree: string; year: string };

export type CandidateProfile = {
  id?: number;
  title: string | null;
  overview: string | null;
  location: string | null;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  phone: string | null;
  photoPath: string | null;
  experience: string | null; // JSON-encoded ExperienceEntry[]
  projects: string | null;
  certifications: string | null;
  education: string | null;
  languages: string | null; // JSON-encoded string[]
};

export async function getMyProfile(): Promise<CandidateProfile | null> {
  const res = await apiFetch("/candidate-profile/me");
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export async function updateMyProfile(input: Partial<{
  title: string; overview: string; location: string;
  expectedSalaryMin: string; expectedSalaryMax: string; phone: string;
  experience: ExperienceEntry[]; projects: ProjectEntry[];
  certifications: CertificationEntry[]; education: EducationEntry[]; languages: string[];
}>) {
  const res = await apiFetch("/candidate-profile/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
  return res.json();
}

export async function uploadMyPhoto(file: File) {
  const formData = new FormData();
  formData.append("photo", file);
  const res = await apiFetch("/candidate-profile/me/photo", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Photo upload failed");
  return res.json();
}

export function getCandidatePhotoUrl(candidateId: number) {
  return `${API_URL}/candidate-profile/${candidateId}/photo`;
}

export async function candidateLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/candidate-auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Login failed");
  return data;
}

export async function candidateSignup(email: string, password: string, name: string) {
  const res = await fetch(`${API_URL}/candidate-auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Signup failed");
  return data;
}

export async function getMyCandidateAccount() {
  const res = await apiFetch("/candidate-auth/me");
  if (!res.ok) return null;
  return res.json();
}




// Sends a CV file to the backend, which uses the profile-extraction agent
// to parse it and return a structured profile. The backend does not save
// the extracted profile — it just returns it to the frontend for review.
export async function extractProfileFromCv(file: File) {
  const formData = new FormData();
  formData.append("cv", file);
  const res = await apiFetch("/candidate-profile/me/extract-from-cv", { method: "POST", body: formData });
  if (!res.ok) throw new Error((await res.json()).error ?? "Extraction failed");
  return res.json();
}


// Sends a message to the candidate's digital twin and returns the twin's response.
export async function chatWithTwin(candidateId: number, message: string) {
  const res = await fetch(`${API_URL}/candidate-profile/${candidateId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Chat failed");
  return res.json();
}


export async function getPublicProfile(candidateId: string) {
  const res = await fetch(`${API_URL}/candidate-profile/${candidateId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Profile not found");
  return res.json();
}



export type MyApplication = {
  id: number;
  jobTitle: string;
  status: string;
  submittedAt: string;
  interviewEmailSubject: string | null;
};

export async function getMyApplications(): Promise<MyApplication[]> {
  const res = await apiFetch("/candidate-profile/me/applications");
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
}

export async function candidateLogout() {
  await fetch(`${API_URL}/candidate-auth/logout`, { method: "POST", credentials: "include" });
}

export type TalentPoolEntry = { id: number; name: string; title: string | null; location: string | null };



export async function getTalentPool(): Promise<TalentPoolEntry[]> {
  const res = await apiFetch("/candidate-profile");
  if (!res.ok) throw new Error("Failed to load candidates");
  return res.json();
}

export { API_URL };