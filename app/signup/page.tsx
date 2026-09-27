"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function HrSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Signup failed");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold mb-1">Set up your company</h1>
        <p className="text-muted text-sm mb-8">Create your HR account to start posting roles.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required
            className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email" required
            className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required
            className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber" />
          {error && <p className="text-red text-sm">{error}</p>}
          <button type="submit" disabled={submitting}
            className="font-display text-sm font-medium bg-amber text-[#1A1204] rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="text-xs text-muted mt-4 text-center">
          Already have an account? <a href="/login" className="text-amber underline">Log in</a>
        </p>
      </div>
    </div>
  );
}