"use client";

import React, { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  FaPlus,
  FaFileAlt,
  FaStar,
  FaTimes,
  FaDownload,
  FaExternalLinkAlt,
  FaSearch,
} from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const AVAILABLE_TAGS = [
  "Factures",
  "Impôts",
  "Identité",
  "Santé",
  "Assurance",
  "Autres",
];

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

function getTypeIcon(type: string) {
  const icons: Record<string, string> = {
    CONTRACT: "📜",
    INVOICE: "📄",
    INSURANCE: "🛡️",
    IDENTITY: "🆔",
    TAX: "📊",
    OTHER: "📋",
  };
  return icons[type] || "📋";
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    CONTRACT: "bg-blue-100 text-blue-700",
    INVOICE: "bg-purple-100 text-purple-700",
    INSURANCE: "bg-green-100 text-green-700",
    IDENTITY: "bg-orange-100 text-orange-700",
    TAX: "bg-red-100 text-red-700",
    OTHER: "bg-gray-100 text-gray-700",
  };
  return colors[type] || "bg-gray-100 text-gray-700";
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"date" | "name" | "favorites">("date");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagEditor, setShowTagEditor] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>("");

  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/documents/favorite?id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to toggle favorite");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const updateTags = useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const res = await fetch(`/api/documents/tags?id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) throw new Error("Failed to update tags");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setShowTagEditor(null);
      setTagInput("");
    },
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = Array.isArray(documents) ? documents.slice() : [];

    // Search filter
    if (q) {
      list = list.filter(
        (d: any) =>
          d.name?.toLowerCase().includes(q) ||
          d.type?.toLowerCase().includes(q) ||
          d.tags?.some((tag: string) => tag.toLowerCase().includes(q)),
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      list = list.filter((d: any) =>
        selectedTags.some((tag) => d.tags?.includes(tag)),
      );
    }

    // Sort
    if (sort === "name") {
      list.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    } else if (sort === "favorites") {
      list.sort(
        (a: any, b: any) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0),
      );
    } else {
      list.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return list;
  }, [documents, searchQuery, sort, selectedTags]);

  const favorites = filtered.filter((d: any) => d.isFavorite);
  const others = filtered.filter((d: any) => !d.isFavorite);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mes Documents</h1>
            <p className="text-muted-foreground">
              Coffre-fort numérique — gérez vos fichiers en toute sécurité.
            </p>
          </div>
          <Link
            href="/dashboard/documents/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <FaPlus /> Ajouter
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom, type ou tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            <option value="date">Trier par date</option>
            <option value="name">Trier par nom</option>
            <option value="favorites">Favoris en premier</option>
          </select>
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTags((prev) =>
                  prev.includes(tag)
                    ? prev.filter((t) => t !== tag)
                    : [...prev, tag],
                );
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedTags.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Chargement des documents...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl border-2 border-dashed border-border bg-muted/30 text-center">
          <div className="p-6 rounded-full bg-primary/10 text-primary mb-6">
            <FaFileAlt size={44} />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {searchQuery || selectedTags.length > 0
              ? "Aucun document trouvé"
              : "Votre coffre-fort est vide"}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchQuery || selectedTags.length > 0
              ? "Modifiez vos filtres ou créez un nouveau document."
              : "Ajoutez vos premiers documents pour commencer."}
          </p>
          <Link
            href="/dashboard/documents/new"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <FaPlus /> Ajouter un document
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Favoris Section */}
          {favorites.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FaStar className="text-yellow-500" size={20} />
                <h2 className="text-xl font-bold">Favoris</h2>
                <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                  {favorites.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onToggleFavorite={toggleFavorite.mutate}
                    onEditTags={() => {
                      setShowTagEditor(doc.id);
                      setTagInput(doc.tags?.join(", ") || "");
                    }}
                    showTagEditor={showTagEditor === doc.id}
                    tagInput={tagInput}
                    setTagInput={setTagInput}
                    onSaveTags={(tags) => {
                      updateTags.mutate({
                        id: doc.id,
                        tags: tags
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      });
                    }}
                    onCancelTags={() => setShowTagEditor(null)}
                    isFavoritePending={toggleFavorite.isPending}
                    isUpdateTagsPending={updateTags.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {others.length > 0 && (
            <div className="space-y-4">
              {favorites.length > 0 && (
                <h2 className="text-xl font-bold">Tous les documents</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {others.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onToggleFavorite={toggleFavorite.mutate}
                    onEditTags={() => {
                      setShowTagEditor(doc.id);
                      setTagInput(doc.tags?.join(", ") || "");
                    }}
                    showTagEditor={showTagEditor === doc.id}
                    tagInput={tagInput}
                    setTagInput={setTagInput}
                    onSaveTags={(tags) => {
                      updateTags.mutate({
                        id: doc.id,
                        tags: tags
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      });
                    }}
                    onCancelTags={() => setShowTagEditor(null)}
                    isFavoritePending={toggleFavorite.isPending}
                    isUpdateTagsPending={updateTags.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface DocumentCardProps {
  doc: any;
  onToggleFavorite: (id: string) => void;
  onEditTags: () => void;
  showTagEditor: boolean;
  tagInput: string;
  setTagInput: (value: string) => void;
  onSaveTags: (tags: string) => void;
  onCancelTags: () => void;
  isFavoritePending: boolean;
  isUpdateTagsPending: boolean;
}

function DocumentCard({
  doc,
  onToggleFavorite,
  onEditTags,
  showTagEditor,
  tagInput,
  setTagInput,
  onSaveTags,
  onCancelTags,
  isFavoritePending,
  isUpdateTagsPending,
}: DocumentCardProps) {
  const status = getStatus(doc.expirationDate);
  const typeIcon = getTypeIcon(doc.type);
  const typeColor = getTypeColor(doc.type);

  return (
    <div className="group relative rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden">
      {/* Header avec icône et status */}
      <div className="p-5 pb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-3xl flex-shrink-0">{typeIcon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight line-clamp-2 mb-1">
              {doc.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${typeColor}`}
              >
                {doc.type}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full font-bold ${
                  status.color === "emerald"
                    ? "bg-emerald-100 text-emerald-700"
                    : status.color === "red"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Bouton favoris */}
        <button
          onClick={() => onToggleFavorite(doc.id)}
          disabled={isFavoritePending}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          aria-label="Toggle favorite"
        >
          <FaStar
            size={18}
            className={`transition-colors ${
              doc.isFavorite
                ? "text-yellow-500 fill-yellow-500"
                : "text-muted-foreground"
            }`}
          />
        </button>
      </div>

      {/* Description */}
      {doc.description && (
        <div className="px-5 py-2 text-sm text-muted-foreground line-clamp-2">
          {doc.description}
        </div>
      )}

      {/* Tags */}
      <div className="px-5 py-3 border-t border-border">
        {showTagEditor ? (
          <div className="space-y-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Entrez les tags (séparés par des virgules)"
              className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isUpdateTagsPending}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancelTags}
                disabled={isUpdateTagsPending}
                className="px-3 py-1 text-sm rounded border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => onSaveTags(tagInput)}
                disabled={isUpdateTagsPending}
                className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isUpdateTagsPending ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            {doc.tags && doc.tags.length > 0 ? (
              <>
                {doc.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {tag}
                  </span>
                ))}
                <button
                  onClick={onEditTags}
                  className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  Modifier
                </button>
              </>
            ) : (
              <button
                onClick={onEditTags}
                className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                + Ajouter des tags
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {doc.expirationDate
            ? new Date(doc.expirationDate).toLocaleDateString("fr-FR")
            : "Aucune expiration"}
        </div>
        <a
          href={doc.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <FaDownload size={14} />
          <span>Voir</span>
        </a>
      </div>
    </div>
  );
}
