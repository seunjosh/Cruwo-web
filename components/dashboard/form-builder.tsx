"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { getFormTemplates, saveFormTemplate, type FormField, type FormTemplate } from "@/lib/api";
import { useEffect } from "react";

// A single field row in the builder — label, type, required toggle, and
// (for "select") the list of options.
function FieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: FormField;
  onChange: (field: FormField) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg p-4 flex flex-col gap-3">
      <div className="flex gap-3">
        <input
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          placeholder="Question label, e.g. Years of experience"
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
        />
        <select
          value={field.type}
          onChange={(e) => onChange({ ...field, type: e.target.value as FormField["type"] })}
          className="bg-surface border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-amber"
        >
          <option value="text">Short text</option>
          <option value="textarea">Long text</option>
          <option value="number">Number</option>
          <option value="select">Dropdown</option>
          <option value="yesno">Yes / No</option>
        </select>
        <button onClick={onRemove} className="text-muted hover:text-red transition-colors px-2">
          <X className="w-4 h-4" />
        </button>
      </div>

      {field.type === "select" && (
        <input
          value={field.options?.join(", ") ?? ""}
          onChange={(e) => onChange({ ...field, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          placeholder="Options, comma-separated — e.g. Immediate, 2 weeks, 1 month"
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
        />
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ ...field, required: e.target.checked })}
          className="w-3.5 h-3.5 accent-amber"
        />
        <span className="text-xs text-muted">Required</span>
      </label>
    </div>
  );
}

// The full builder: load/apply a saved template, add/edit/remove fields,
// save the current set as a new reusable template. `fields`/`onChange`
// are controlled from the parent (Post a Job), so the parent owns what
// actually gets submitted with the job.
export function FormBuilder({
  fields,
  onChange,
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}) {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFormTemplates().then(setTemplates);
  }, []);

  const addField = () => {
    onChange([
      ...fields,
      { id: `field_${Date.now()}`, label: "", type: "text", required: false },
    ]);
  };

  const updateField = (index: number, updated: FormField) => {
    const next = [...fields];
    next[index] = updated;
    onChange(next);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => String(t.id) === templateId);
    if (template) onChange(JSON.parse(template.fields));
  };

  const handleSaveTemplate = async () => {
    if (!templateName || fields.length === 0) return;
    setSaving(true);
    try {
      const saved = await saveFormTemplate(templateName, fields);
      setTemplates([saved, ...templates]);
      setTemplateName("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {templates.length > 0 && (
        <div>
          <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
            START FROM A SAVED TEMPLATE
          </label>
          <select
            onChange={(e) => applyTemplate(e.target.value)}
            defaultValue=""
            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber"
          >
            <option value="" disabled>Choose a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {fields.map((field, i) => (
          <FieldRow
            key={field.id}
            field={field}
            onChange={(updated) => updateField(i, updated)}
            onRemove={() => removeField(i)}
          />
        ))}
      </div>

      <button
        onClick={addField}
        className="flex items-center gap-2 text-sm text-amber self-start hover:opacity-80 transition-opacity"
      >
        <Plus className="w-4 h-4" /> Add question
      </button>

      {fields.length > 0 && (
        <div className="flex gap-2 items-center pt-3 border-t border-border">
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Save this set as a template..."
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
          />
          <button
            onClick={handleSaveTemplate}
            disabled={saving || !templateName}
            className="text-sm border border-border rounded-lg px-3 py-2 hover:bg-bg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save as template"}
          </button>
        </div>
      )}
    </div>
  );
}