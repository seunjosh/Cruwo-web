"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { candidateLogout } from "@/lib/api";

export function CandidateLogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await candidateLogout();
    router.push("/");
    router.refresh();
  };
  return (
    <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-muted hover:text-red transition-colors">
      <LogOut className="w-3.5 h-3.5" /> Log out
    </button>
  );
}