"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh(); // clears any cached server-rendered HR data
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-xs text-muted hover:text-red transition-colors"
    >
      <LogOut className="w-3.5 h-3.5" /> Log out
    </button>
  );
}