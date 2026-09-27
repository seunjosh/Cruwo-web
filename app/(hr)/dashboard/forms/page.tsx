"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  getFormTemplates,
  saveFormTemplate,
  deleteFormTemplate,
  type FormTemplate,
  type FormField,
} from "@/lib/api";
import { FormBuilder } from "@/components/dashboard/form-builder";

export default function ApplicationFormsPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFields, setNewFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

  const load = async () => {
    const data = await getFormTemplates();
    setTemplates(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newName || newFields.length === 0) return;
    setSaving(true);
    try {
      await saveFormTemplate(newName, newFields);
      setNewName("");
      setNewFields([]);
      setCreating(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteFormTemplate(id);
    setConfirmingDeleteId(null);
    await load();
  };

  if (loading) {
    return <div className="p-8 text-muted">Loading forms...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl font-bold">Application forms</h1>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New form
          </button>
        )}
      </div>
      <p className="text-muted text-sm mb-8">
        Build reusable question sets for Guided Applications — pick one when posting a job.
      </p>

      {creating && (
        <div className="rounded-xl border border-border bg-surface p-5 mb-6">
          <div className="mb-4">
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
              FORM NAME
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Engineering screening questions"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
            />
          </div>
          <FormBuilder fields={newFields} onChange={setNewFields} />
          <div className="flex gap-3 mt-4 pt-4 border-t border-border">
            <button
              onClick={handleCreate}
              disabled={saving || !newName || newFields.length === 0}
              className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save form"}
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(""); setNewFields([]); }}
              className="text-sm border border-border rounded-lg px-4 py-2 hover:bg-bg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {templates.length === 0 && !creating && (
          <p className="text-muted text-sm">No forms yet — create one to use in Guided Applications.</p>
        )}
        {templates.map((t) => {
          let fields: FormField[] = [];
          try {
            fields = JSON.parse(t.fields);
          } catch {
            fields = [];
          }
          return (
            <div key={t.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-medium">{t.name}</span>
                {confirmingDeleteId === t.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs bg-red text-[#2A0808] rounded-lg px-3 py-1.5"
                    >
                      Confirm delete
                    </button>
                    <button
                      onClick={() => setConfirmingDeleteId(null)}
                      className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-bg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingDeleteId(t.id)}
                    className="text-muted hover:text-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted">
                {fields.length} question{fields.length !== 1 ? "s" : ""}: {fields.map((f) => f.label).join(", ")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}