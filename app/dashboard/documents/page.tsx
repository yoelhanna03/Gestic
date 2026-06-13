"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  FaPlus,
  FaFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";

async function fetchDocuments() {
  const res = await fetch("/api/documents");
  if (!res.ok) throw new Error("Échec du chargement des documents");
  return res.json();
}

function getStatus(expirationDate: string | null) {
  if (!expirationDate) return { label: "Permanent", color: "emerald" };
  const exp = new Date(expirationDate);
  const now = new Date();
  const diffDays = Math.ceil(
    (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return { label: "Expiré", color: "red" };
  if (diffDays <= 30) return { label: "Expire bientôt", color: "amber" };
  return { label: "Actif", color: "emerald" };
}

export default function DocumentsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"date" | "name">("date");

  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery<unknown[], Error>({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = Array.isArray(documents) ? documents.slice() : [];
    if (q)
      list = list.filter(
        (d: any) =>
          d.name?.toLowerCase().includes(q) ||
          d.type?.toLowerCase().includes(q),
      );
    if (sort === "name")
      list.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    else
      list.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    return list;
  }, [documents, query, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Documents</h1>
          <p className="text-muted-foreground">
            Coffre-fort numérique — gérez vos fichiers en toute sécurité.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            aria-label="Rechercher"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou type..."
            className="px-3 py-2 rounded-lg border border-border bg-background w-64"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-border bg-background"
          >
            <option value="date">Trier par date</option>
            <option value="name">Trier par nom</option>
          </select>
          <Link
            href="/dashboard/documents/new"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 shadow-sm"
          >
            <FaPlus /> Ajouter
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          Chargement...
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          Erreur: {(error as Error).message}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl border-2 border-dashed border-border bg-muted/30 text-center">
          <div className="p-6 rounded-full bg-primary/10 text-primary mb-6">
            <FaFileAlt size={44} />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Votre coffre-fort est vide
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Ajoutez vos premiers documents pour commencer.
          </p>
          <Link
            href="/dashboard/documents/new"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            Ajouter un document
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc: any) => {
            const status = getStatus(doc.expirationDate);
            return (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl text-muted-foreground mt-1">
                    <FaFileAlt />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-lg font-semibold">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.type}
                        </div>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full font-bold text-${status.color}-700 bg-${status.color}-50`}
                      >
                        {status.label}
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      {doc.description}
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground flex justify-between items-center">
                      <div>
                        {doc.expirationDate
                          ? new Date(doc.expirationDate).toLocaleDateString(
                              "fr-FR",
                            )
                          : "Aucune"}
                      </div>
                      <div className="text-right text-xs">
                        Ajouté le{" "}
                        {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                      </div>
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
