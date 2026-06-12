"use client";

import React, { useState } from "react";

export default function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const body = await res.json();
      if (body?.url) window.open(body.url, "_blank");
      else alert(body?.error || "Impossible d'ouvrir le portail");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la connexion au portail");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
    >
      {loading ? "Ouverture..." : "Accéder au portail de facturation"}
    </button>
  );
}
