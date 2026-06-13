"use client";

import React from "react";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function Header({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        console.error("Sign out failed", await res.text());
      }
    } catch (err) {
      console.error("Sign out error", err);
    } finally {
      // Always redirect to landing page after attempting to sign out
      setLoading(false);
      router.push("/");
    }
  }

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {children}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FaUserCircle className="text-xl text-muted-foreground" />
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
          title="Déconnexion"
          aria-disabled={loading}
        >
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
}
