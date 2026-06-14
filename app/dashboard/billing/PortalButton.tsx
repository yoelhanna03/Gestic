"use client";

import React, { useState } from "react";

type PortalButtonProps = {
  mode: "portal" | "checkout";
  label: string;
};

export default function PortalButton({ mode, label }: PortalButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    try {
      setLoading(true);
      const endpoint =
        mode === "portal" ? "/api/stripe/portal" : "/api/stripe/checkout";
      const res = await fetch(endpoint, { method: "POST" });
      const body = await res.json();
      if (body?.url) {
        if (mode === "portal") window.open(body.url, "_blank");
        else window.location.href = body.url;
      } else {
        alert(body?.error || "Impossible de lancer l'action de facturation.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la connexion au service de facturation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
    >
      {loading ? "Chargement..." : label}
    </button>
  );
}
