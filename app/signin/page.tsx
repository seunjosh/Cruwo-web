import Link from "next/link";
import { Briefcase, Search } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-2xl text-center">
        <h1 className="font-display text-2xl font-bold mb-10">Sign in as...</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/login" className="rounded-xl border border-border bg-surface p-8 hover:border-amber/50 transition-colors flex flex-col items-center gap-4">
            <Briefcase className="w-6 h-6 text-amber" />
            <span className="font-display font-medium">HR / Recruiter</span>
          </Link>
          <Link href="/candidate-login" className="rounded-xl border border-border bg-surface p-8 hover:border-amber/50 transition-colors flex flex-col items-center gap-4">
            <Search className="w-6 h-6 text-amber" />
            <span className="font-display font-medium">Candidate</span>
          </Link>
        </div>
      </div>
    </div>
  );
}