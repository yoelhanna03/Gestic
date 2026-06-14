"use client";

import React, { useState } from "react";
import {
  FaExclamationTriangle,
  FaClock,
  FaInfoCircle,
  FaCheck,
} from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type AlertFilter = "all" | "critical" | "unread";

async function fetchAlerts(filter: AlertFilter) {
  const res = await fetch(`/api/alerts?filter=${filter}`);
  if (!res.ok) throw new Error("Échec du chargement des alertes");
  return res.json();
}

function getSeverity(expirationDate: string | null) {
  if (!expirationDate)
    return { label: "Info", color: "blue", bgColor: "sky", icon: FaInfoCircle };
  const exp = new Date(expirationDate);
  const now = new Date();
  const diffDays = Math.ceil(
    (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0)
    return {
      label: "Expiré",
      color: "red",
      bgColor: "red",
      icon: FaExclamationTriangle,
    };
  if (diffDays <= 7)
    return {
      label: "Critique",
      color: "orange",
      bgColor: "amber",
      icon: FaExclamationTriangle,
    };
  if (diffDays <= 30)
    return {
      label: "Important",
      color: "amber",
      bgColor: "amber",
      icon: FaClock,
    };
  return { label: "Info", color: "blue", bgColor: "sky", icon: FaInfoCircle };
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AlertFilter>("all");

  const {
    data: alerts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["alerts", filter],
    queryFn: () => fetchAlerts(filter),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/alerts/mark-read", {
        method: "POST",
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to mark as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const snooze = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const res = await fetch("/api/alerts/snooze", {
        method: "POST",
        body: JSON.stringify({ id, days }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to snooze");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const unreadCount = alerts.filter((a: any) => !a.isRead).length;
  const criticalCount = alerts.filter((a: any) => {
    const doc = a.document;
    const sev = getSeverity(doc?.expirationDate ?? null);
    return sev.label === "Critique" || sev.label === "Expiré";
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
            <p className="text-muted-foreground">
              Centre de notifications — restez informé des documents importants.
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="px-4 py-2 rounded-full bg-red-50 border border-red-200 text-red-800 font-semibold text-sm">
              {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            filter === "unread"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Non lues
          {unreadCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("critical")}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            filter === "critical"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
          }`}
        >
          <FaExclamationTriangle /> Critiques
          {criticalCount > 0 && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold ${
                filter === "critical" ? "bg-red-500" : "bg-red-600 text-white"
              }`}
            >
              {criticalCount}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          {(error as Error).message}
        </div>
      )}

      {/* Alertes List */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed border-border bg-muted/30 text-center">
          <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
            <FaCheck size={36} />
          </div>
          <h2 className="text-xl font-bold mb-1">Aucune alerte</h2>
          <p className="text-muted-foreground max-w-md">
            {filter === "unread"
              ? "Vous avez lu toutes les alertes !"
              : filter === "critical"
                ? "Aucun document critique pour le moment."
                : "Aucune alerte pour le moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert: any) => {
            const doc = alert.document;
            const sev = getSeverity(doc?.expirationDate ?? null);
            const SeverityIcon = sev.icon;

            return (
              <div
                key={alert.id}
                className={`group relative rounded-xl border-2 p-5 transition-all hover:shadow-lg ${
                  sev.bgColor === "red"
                    ? "border-red-200 bg-red-50 hover:bg-red-100"
                    : sev.bgColor === "amber"
                      ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
                      : "border-sky-200 bg-sky-50 hover:bg-sky-100"
                } ${!alert.isRead ? "ring-2 ring-offset-2 ring-primary" : ""}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icône de sévérité */}
                  <div
                    className={`flex-shrink-0 p-3 rounded-lg ${
                      sev.bgColor === "red"
                        ? "bg-red-200 text-red-700"
                        : sev.bgColor === "amber"
                          ? "bg-amber-200 text-amber-700"
                          : "bg-sky-200 text-sky-700"
                    }`}
                  >
                    <SeverityIcon size={20} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-lg leading-tight mb-1">
                          {doc?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {doc?.type} •{" "}
                          {doc?.expirationDate
                            ? new Date(doc.expirationDate).toLocaleDateString(
                                "fr-FR",
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <div
                        className={`flex-shrink-0 px-3 py-1 rounded-full font-bold text-sm whitespace-nowrap ${
                          sev.bgColor === "red"
                            ? "bg-red-200 text-red-700"
                            : sev.bgColor === "amber"
                              ? "bg-amber-200 text-amber-700"
                              : "bg-sky-200 text-sky-700"
                        }`}
                      >
                        {sev.label}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-current border-opacity-10">
                      <button
                        onClick={() => markRead.mutate(alert.id)}
                        disabled={markRead.isPending}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          sev.bgColor === "red"
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : sev.bgColor === "amber"
                              ? "bg-amber-600 text-white hover:bg-amber-700"
                              : "bg-sky-600 text-white hover:bg-sky-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {markRead.isPending
                          ? "Marquage..."
                          : "Marquer comme lu"}
                      </button>
                      <button
                        onClick={() => snooze.mutate({ id: alert.id, days: 1 })}
                        disabled={snooze.isPending}
                        className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {snooze.isPending ? "Report..." : "Reporter 1j"}
                      </button>
                      <button
                        onClick={() => snooze.mutate({ id: alert.id, days: 7 })}
                        disabled={snooze.isPending}
                        className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {snooze.isPending ? "Report..." : "Reporter 7j"}
                      </button>
                    </div>
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
