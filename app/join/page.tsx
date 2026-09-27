import Link from "next/link";
import { Briefcase, Search } from "lucide-react";

export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-2xl text-center">
        <h1 className="font-display text-2xl font-bold mb-10">What brings you here?</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/signup"
            className="rounded-xl border border-border bg-surface p-8 hover:border-amber/50 transition-colors flex flex-col items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-amber" />
            </div>
            <span className="font-display font-medium">I need to hire talent</span>
          </Link>
          <Link
            href="/candidate-signup"
            className="rounded-xl border border-border bg-surface p-8 hover:border-amber/50 transition-colors flex flex-col items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center">
              <Search className="w-6 h-6 text-amber" />
            </div>
            <span className="font-display font-medium">I&apos;m looking for a job</span>
          </Link>
        </div>
      </div>
    </div>
  );
}