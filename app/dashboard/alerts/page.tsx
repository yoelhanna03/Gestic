"use client";

import React from "react";
import { FaExclamationTriangle, FaClock, FaCheckCircle } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchAlerts() {
  const res = await fetch("/api/alerts");
  if (!res.ok) throw new Error("Échec du chargement des alertes");
  return res.json();
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const {
    data: alerts = [],
    isLoading,
    error,
  } = useQuery<unknown[], Error>({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/alerts/mark-read", {
        method: "POST",
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const snooze = useMutation({
    mutationFn: async ({ id, days }: any) => {
      await fetch("/api/alerts/snooze", {
        method: "POST",
        body: JSON.stringify({ id, days }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  function severity(expirationDate: string | null) {
    if (!expirationDate) return { label: "Info", color: "blue" };
    const exp = new Date(expirationDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) return { label: "Critique", color: "red" };
    if (diffDays <= 7) return { label: "Important", color: "orange" };
    return { label: "Info", color: "blue" };
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        Chargement des alertes...
      </div>
    );
  if (error)
    return (
      <div className="p-4 rounded bg-red-50 border border-red-200 text-red-800">
        Erreur: {(error as Error).message}
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
        <p className="text-muted-foreground">
          Flux d'alertes pour les documents expirés ou proches de l'expiration.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="p-6 rounded-2xl bg-card border border-border text-sm text-muted-foreground">
          Aucune alerte pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((doc: any) => {
            const sev = severity(doc.expirationDate);
            return (
              <div
                key={doc.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${sev.color === "red" ? "border-red-200 bg-red-50" : sev.color === "orange" ? "border-amber-200 bg-amber-50" : "border-sky-100 bg-sky-50"}`}
              >
                <div className="mt-1 text-2xl text-muted-foreground">
                  {sev.color === "red" ? (
                    <FaExclamationTriangle />
                  ) : sev.color === "orange" ? (
                    <FaClock />
                  ) : (
                    <FaCheckCircle />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc.type} — Expiration:{" "}
                        {doc.expirationDate
                          ? new Date(doc.expirationDate).toLocaleDateString(
                              "fr-FR",
                            )
                          : "N/A"}
                      </div>
                    </div>
                    <div className={`text-sm font-bold text-${sev.color}-700`}>
                      {sev.label}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => markRead.mutate(doc.id)}
                      className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm"
                    >
                      Marquer comme lu
                    </button>
                    <button
                      onClick={() => snooze.mutate({ id: doc.id, days: 7 })}
                      className="px-3 py-1 rounded border border-border text-sm"
                    >
                      Reporter 7j
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
