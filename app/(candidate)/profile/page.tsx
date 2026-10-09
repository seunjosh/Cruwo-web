"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Avatar } from "@/components/candidate/avatar";
import {
  getMyProfile, updateMyProfile, uploadMyPhoto, getMyCandidateAccount, extractProfileFromCv, getCandidatePhotoUrl,
  updateMyAccount, deleteMyAccount,
  type ExperienceEntry, type ProjectEntry,
  type CertificationEntry, type EducationEntry,
} from "@/lib/api";

export default function ProfilePage() {
  const [account, setAccount] = useState<{ email: string; firstName?: string | null; lastName?: string | null } | null>(null);
  const [candidateAccountId, setCandidateAccountId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cvStatusMsg, setCvStatusMsg] = useState<string | null>(null);

  // Holds the CV the user just picked while we wait for them to confirm that
  // it should replace their existing profile data (only used when the profile
  // already has content — see onCvSelected).
  const [pendingCv, setPendingCv] = useState<File | null>(null);

  const parse = <T,>(json: string | null): T[] => {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  };

  const load = async () => {
    const [acc, profile] = await Promise.all([getMyCandidateAccount(), getMyProfile()]);
    setAccount(acc);
    setCandidateAccountId(acc?.candidateId ?? null);
    setFirstName(acc?.firstName ?? "");
    setLastName(acc?.lastName ?? "");
    if (profile) {
      setTitle(profile.title ?? "");
      setOverview(profile.overview ?? "");
      setLocation(profile.location ?? "");
      setSalaryMin(profile.expectedSalaryMin != null ? String(profile.expectedSalaryMin) : "");
      setSalaryMax(profile.expectedSalaryMax != null ? String(profile.expectedSalaryMax) : "");
      setPhone(profile.phone ?? "");
      setExperience(parse(profile.experience));
      setProjects(parse(profile.projects));
      setCertifications(parse(profile.certifications));
      setEducation(parse(profile.education));
      setLanguages(parse(profile.languages));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveBasics = async () => {
    setSaving(true);
    try {
      await updateMyProfile({ title, overview, location, expectedSalaryMin: salaryMin, expectedSalaryMax: salaryMax, phone });
      setEditingSection(null);
    } finally { setSaving(false); }
  };

  const saveName = async () => {
    setSaving(true);
    try {
      await updateMyAccount(firstName, lastName);
      await load();
      setEditingSection(null);
    } finally { setSaving(false); }
  };

  // The basics form edits both profile fields and the account name.
  // Order matters: saveName() calls load(), which would overwrite any
  // unsaved profile edits, so the profile is saved first.
  const saveBasicsAndName = async () => {
    await saveBasics();
    await saveName();
  };

  const saveSection = async (
    field: "experience" | "projects" | "certifications" | "education" | "languages",
    value: any
  ) => {
    setSaving(true);
    try {
      await updateMyProfile({ [field]: value } as any);
      setEditingSection(null);
    } finally { setSaving(false); }
  };

  // Removes one entry AND saves right away, so a refresh can't bring it back.
  const removeEntry = async <T,>(
    field: "experience" | "projects" | "certifications" | "education",
    items: T[],
    setItems: (v: T[]) => void,
    index: number
  ) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    await updateMyProfile({ [field]: next } as any);
  };

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploading(true);
    try { await uploadMyPhoto(file); await load(); } finally { setPhotoUploading(false); }
  };

  // True if the profile already has CV-derived content a new upload would replace.
  const hasExistingContent = Boolean(
    overview || experience.length || projects.length || certifications.length || education.length || languages.length
  );

  // If there's existing content, ask before replacing it; otherwise go straight ahead.
  const onCvSelected = (file: File) => {
    if (hasExistingContent) setPendingCv(file);
    else handleCvUpload(file);
  };

  const handleCvUpload = async (file: File) => {
    setPendingCv(null);
    setExtracting(true);
    setCvStatusMsg(null);
    try {
      const result = await extractProfileFromCv(file);

      // Nothing readable: leave the existing profile untouched.
      if (!result.extracted) {
        setCvStatusMsg("Your CV was saved, but no text could be read from it (it may be a scanned image). Your existing details were left unchanged.");
        return;
      }

      // REPLACE every CV-derived field. Anything the new CV doesn't contain
      // is cleared, so old details never linger. Salary range and photo
      // aren't from a CV, so they're kept.
      const next = {
        title: result.title ?? "",
        overview: result.overview ?? "",
        location: result.location ?? "",
        phone: result.phone ?? "",
        experience: result.experience ?? [],
        projects: result.projects ?? [],
        certifications: result.certifications ?? [],
        education: result.education ?? [],
        languages: result.languages ?? [],
      };
      setTitle(next.title); setOverview(next.overview); setLocation(next.location); setPhone(next.phone);
      setExperience(next.experience); setProjects(next.projects);
      setCertifications(next.certifications); setEducation(next.education); setLanguages(next.languages);
      await updateMyProfile(next);

      setCvStatusMsg(
        result.method === "agent"
          ? "Your CV was saved and your profile was replaced with its contents."
          : "Your CV was saved and your profile was filled using basic parsing, which is rougher than usual. Please review each section."
      );
    } finally {
      setExtracting(false);
    }
  };

  if (loading) return <div className="p-8 text-muted">Loading profile...</div>;

  const displayName = [account?.firstName, account?.lastName].filter(Boolean).join(" ") || account?.email;

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Header card */}
      <div className="rounded-xl border border-border bg-surface p-6 mb-6 flex gap-6">
        <div className="relative">
          <div className={`w-24 h-24 rounded-lg bg-bg border border-border flex items-center justify-center text-2xl font-display text-muted overflow-hidden transition-opacity ${photoUploading ? "opacity-50" : ""}`}>
            {photoUploading
              ? <span className="text-xs">Uploading...</span>
              : candidateAccountId && <Avatar src={getCandidatePhotoUrl(candidateAccountId)} name={displayName ?? ""} size={96} />}
          </div>
          <label className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-amber flex items-center justify-center ${photoUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
            <Pencil className="w-3.5 h-3.5 text-[#1A1204]" />
            <input type="file" accept="image/*" className="hidden" disabled={photoUploading}
              onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
          </label>
        </div>
        <div className="flex-1">
          {editingSection === "basics" ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name"
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:border-amber" />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name"
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:border-amber" />
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. AI Engineer"
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
              <div className="flex gap-2">
                <input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="Min salary/mo" type="number"
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:border-amber" />
                <input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="Max salary/mo" type="number"
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:border-amber" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:border-amber" />
              </div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone"
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
              <button onClick={saveBasicsAndName} disabled={saving}
                className="font-display text-xs font-medium bg-amber text-[#1A1204] rounded-lg px-3 py-1.5 self-start disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted">{title || "Add a title"}</p>
                <button onClick={() => setEditingSection("basics")} className="text-muted hover:text-amber">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <h1 className="font-display text-xl font-bold mb-2">{displayName}</h1>
              <div className="flex gap-2">
                {(salaryMin || salaryMax) && (
                  <span className="text-xs bg-bg border border-border rounded-full px-3 py-1">
                    ${salaryMin || "?"}–${salaryMax || "?"}/mo
                  </span>
                )}
                {location && <span className="text-xs bg-bg border border-border rounded-full px-3 py-1">{location}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <label className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity cursor-pointer">
          {extracting ? "Reading your CV..." : "Fill from CV"}
          {/* onCvSelected asks for confirmation only when the profile already
              has content; otherwise it uploads right away. e.target.value is
              reset so choosing the same file again (after cancelling) still
              triggers onChange. */}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={extracting}
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Reset first so picking the same file twice still fires onChange.
              e.target.value = "";
              if (file) onCvSelected(file);
            }}
          />
        </label>
        <p className="text-xs text-muted">Upload a CV and we&apos;ll fill in your profile automatically — you can edit anything after.</p>
      </div>

      {/* Confirm panel: shown only when a CV is pending (profile already has
          content). "Replace details" runs the upload; "Cancel" discards the pick. */}
      {pendingCv && (
        <div className="mb-6 rounded-lg border border-amber/40 bg-surface p-4">
          <p className="text-sm mb-3">
            Replace your current profile details with what&apos;s in{" "}
            <span className="font-medium">{pendingCv.name}</span>? Your photo and salary range are kept.
          </p>
          <div className="flex gap-3">
            <button onClick={() => handleCvUpload(pendingCv)}
              className="font-display text-xs font-medium bg-amber text-[#1A1204] rounded-lg px-3 py-1.5">
              Replace details
            </button>
            <button onClick={() => setPendingCv(null)}
              className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-bg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {cvStatusMsg && <p className="text-xs text-green mt-2">{cvStatusMsg}</p>}
      {/* Overview + Contact */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-display text-base font-medium">Overview</h2>
            <button onClick={() => setEditingSection(editingSection === "overview" ? null : "overview")} className="text-muted hover:text-amber">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
          {editingSection === "overview" ? (
            <div className="flex flex-col gap-2">
              <textarea rows={4} value={overview} onChange={(e) => setOverview(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
              <button onClick={saveBasics} disabled={saving}
                className="font-display text-xs font-medium bg-amber text-[#1A1204] rounded-lg px-3 py-1.5 self-start disabled:opacity-50">
                Save
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted leading-relaxed">{overview || "—"}</p>
          )}
        </div>
        <div>
          <h2 className="font-display text-base font-medium mb-2">Contact</h2>
          <p className="text-sm text-muted">{account?.email}</p>
          {phone && <p className="text-sm text-muted">{phone}</p>}
        </div>
      </div>

      {/* Sections are intentionally simple list-editors — good enough for
          now; can get richer (drag-reorder, etc.) later if needed. */}
      <ListSection
        title="Experience" items={experience}
        render={(e: ExperienceEntry) => [e.title, e.company && `at ${e.company}`, e.duration && `(${e.duration})`].filter(Boolean).join(" ")}
        onAdd={() => setExperience([...experience, { title: "", company: "", duration: "", description: "" }])}
        onSave={() => saveSection("experience", experience)}
        editing={editingSection === "experience"} onEdit={() => setEditingSection("experience")}
        renderEditor={(item, i, update) => (
          <div className="flex flex-col gap-2">
            <input value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} placeholder="Job title"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
            <input value={item.company} onChange={(e) => update({ ...item, company: e.target.value })} placeholder="Company"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
            <input value={item.duration} onChange={(e) => update({ ...item, duration: e.target.value })} placeholder="e.g. 2022–Present"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
            <textarea rows={2} value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} placeholder="What you did"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
          </div>
        )}
        onRemove={(i) => removeEntry("experience", experience, setExperience, i)}
        onUpdate={(i, item) => setExperience(experience.map((e, idx) => (idx === i ? item : e)))}
        saving={saving}
      />

      <ListSection
        title="Projects" items={projects}
        render={(p: ProjectEntry) => p.name}
        onAdd={() => setProjects([...projects, { name: "", description: "", link: "" }])}
        onSave={() => saveSection("projects", projects)}
        editing={editingSection === "projects"} onEdit={() => setEditingSection("projects")}
        renderEditor={(item, i, update) => (
          <div className="flex flex-col gap-2">
            <input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} placeholder="Project name"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
            <textarea rows={2} value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} placeholder="Description"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
            <input value={item.link ?? ""} onChange={(e) => update({ ...item, link: e.target.value })} placeholder="Link (optional)"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
          </div>
        )}
        onRemove={(i) => removeEntry("projects", projects, setProjects, i)}
        onUpdate={(i, item) => setProjects(projects.map((p, idx) => (idx === i ? item : p)))}
        saving={saving}
      />

      <ListSection
        title="Certifications" items={certifications}
        render={(c: CertificationEntry) => [c.name, c.issuer && `— ${c.issuer}`, c.year && `(${c.year})`].filter(Boolean).join(" ")}
        onAdd={() => setCertifications([...certifications, { name: "", issuer: "", year: "" }])}
        onSave={() => saveSection("certifications", certifications)}
        editing={editingSection === "certifications"} onEdit={() => setEditingSection("certifications")}
        renderEditor={(item, i, update) => (
          <div className="flex flex-col gap-2">
            <input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} placeholder="Certification name"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
            <input value={item.issuer} onChange={(e) => update({ ...item, issuer: e.target.value })} placeholder="Issuer"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
            <input value={item.year} onChange={(e) => update({ ...item, year: e.target.value })} placeholder="Year"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
          </div>
        )}
        onRemove={(i) => removeEntry("certifications", certifications, setCertifications, i)}
        onUpdate={(i, item) => setCertifications(certifications.map((c, idx) => (idx === i ? item : c)))}
        saving={saving}
      />

      <ListSection
        title="Education" items={education}
        render={(e: EducationEntry) => [e.degree, e.school, e.year && `(${e.year})`].filter(Boolean).join(", ")}
        onAdd={() => setEducation([...education, { school: "", degree: "", year: "" }])}
        onSave={() => saveSection("education", education)}
        editing={editingSection === "education"} onEdit={() => setEditingSection("education")}
        renderEditor={(item, i, update) => (
          <div className="flex flex-col gap-2">
            <input value={item.school} onChange={(e) => update({ ...item, school: e.target.value })} placeholder="School"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
            <input value={item.degree} onChange={(e) => update({ ...item, degree: e.target.value })} placeholder="Degree"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
            <input value={item.year} onChange={(e) => update({ ...item, year: e.target.value })} placeholder="Year"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber" />
          </div>
        )}
        onRemove={(i) => removeEntry("education", education, setEducation, i)}
        onUpdate={(i, item) => setEducation(education.map((e, idx) => (idx === i ? item : e)))}
        saving={saving}
      />

      {/* Languages — simpler, just a comma list */}
      <div className="rounded-xl border border-border bg-surface p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-base font-medium">Languages</h2>
          <button onClick={() => setEditingSection(editingSection === "languages" ? null : "languages")} className="text-muted hover:text-amber">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
        {editingSection === "languages" ? (
          <div className="flex flex-col gap-2">
            <input
              value={languages.join(", ")}
              onChange={(e) => setLanguages(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="English, Yoruba, ..."
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
            />
            <button onClick={() => saveSection("languages", languages)} disabled={saving}
              className="font-display text-xs font-medium bg-amber text-[#1A1204] rounded-lg px-3 py-1.5 self-start disabled:opacity-50">
              Save
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">{languages.join(", ") || "—"}</p>
        )}
      </div>

      {/* Delete account */}
      <div className="border-t border-border pt-6 mt-8">
        <h2 className="font-display text-base font-medium text-red mb-2">Delete account</h2>
        <p className="text-xs text-muted mb-3">
          This permanently deletes your profile and login. Applications you&apos;ve submitted stay on record for the companies you applied to, but will no longer be linked to your account.
        </p>
        {confirmingDelete ? (
          <div className="flex gap-3">
            <button
              onClick={async () => {
                setDeleting(true);
                try {
                  await deleteMyAccount();
                  window.location.href = "/";
                } catch {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="text-sm bg-red text-[#2A0808] rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="text-sm border border-border rounded-lg px-4 py-2 hover:bg-bg transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} className="text-sm border border-red text-red rounded-lg px-4 py-2 hover:bg-red/10 transition-colors">
            Delete my account
          </button>
        )}
      </div>
    </div>
  );
}

// Generic list-section editor shared by Experience/Projects/Certifications/Education.
function ListSection<T>({
  title, items, render, onAdd, onSave, editing, onEdit, renderEditor, onRemove, onUpdate, saving,
}: {
  title: string;
  items: T[];
  render: (item: T) => string;
  onAdd: () => void;
  onSave: () => void;
  editing: boolean;
  onEdit: () => void;
  renderEditor: (item: T, i: number, update: (item: T) => void) => React.ReactNode;
  onRemove: (i: number) => void;
  onUpdate: (i: number, item: T) => void;
  saving: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-medium">{title}</h2>
        <div className="flex gap-2">
          <button onClick={onAdd} className="text-muted hover:text-amber"><Plus className="w-4 h-4" /></button>
          <button onClick={onEdit} className="text-muted hover:text-amber"><Pencil className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {items.length === 0 && <p className="text-sm text-muted">—</p>}
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="pb-3 border-b border-border last:border-0 last:pb-0">
            {editing ? (
              <div className="flex gap-2 items-start">
                <div className="flex-1">{renderEditor(item, i, (updated) => onUpdate(i, updated))}</div>
                <button onClick={() => onRemove(i)} className="text-muted hover:text-red mt-2">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted">{render(item)}</p>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <button onClick={onSave} disabled={saving}
          className="font-display text-xs font-medium bg-amber text-[#1A1204] rounded-lg px-3 py-1.5 mt-3 disabled:opacity-50">
          {saving ? "Saving..." : "Save section"}
        </button>
      )}
    </div>
  );
}