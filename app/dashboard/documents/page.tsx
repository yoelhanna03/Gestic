"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaPlus, FaFileAlt, FaExclamationTriangle, FaCheckCircle, FaClock, FaCloudUploadAlt } from 'react-icons/fa';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState({ current: 0, max: 3, isPremium: false });

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch('/api/documents');
        const data = await res.json();
        if (Array.isArray(data)) {
          setDocuments(data);
          setStorageInfo(prev => ({
            ...prev,
            current: data.length,
          }));
        }
      } catch (e) {
        console.error("Erreur lors du chargement des documents", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocs();
  }, []);

  const getStatus = (expirationDate: string | null) => {
    if (!expirationDate) return { label: 'Permanent', icon: <FaCheckCircle />, color: 'text-emerald-600 bg-emerald-50' };

    const exp = new Date(expirationDate);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Expiré', icon: <FaExclamationTriangle />, color: 'text-red-600 bg-red-50' };
    if (diffDays <= 30) return { label: 'Expire bientôt', icon: <FaClock />, color: 'text-amber-600 bg-amber-50' };
    return { label: 'Actif', icon: <FaCheckCircle />, color: 'text-emerald-600 bg-emerald-50' };
  };

  if (isLoading) return <div className="flex items-center justify-center h-full">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Mes Documents</h1>
          <p className="text-muted-foreground">Gérez et surveillez les documents administratifs de votre foyer.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-medium text-muted-foreground uppercase">Stockage</div>
            <div className="text-sm font-bold">{storageInfo.current} / {storageInfo.max} documents</div>
            <div className="w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all ${storageInfo.current >= storageInfo.max ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${Math.min((storageInfo.current / storageInfo.max) * 100, 100)}%` }}
              />
            </div>
          </div>
          <Link
            href="/dashboard/documents/new"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <FaPlus /> Ajouter
          </Link>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 rounded-3xl border-2 border-dashed border-border bg-muted/30 text-center max-w-3xl mx-auto">
          <div className="p-6 rounded-full bg-primary/10 text-primary mb-6">
            <FaCloudUploadAlt size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Votre coffre-fort est vide</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Commencez par ajouter vos premiers contrats, assurances ou documents d'identité pour garder l'esprit tranquille et ne plus rien oublier.
          </p>
          <Link
            href="/dashboard/documents/new"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            <FaPlus /> Ajouter mon premier document
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                <tr className="text-xs uppercase tracking-wider">
                  <th className="px-6 py-3">Nom du Document</th>
                  <th className="px-6 py-3">Catégorie</th>
                  <th className="px-6 py-3">Expiration</th>
                  <th className="px-6 py-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map((doc) => {
                  const status = getStatus(doc.expirationDate);
                  return (
                    <tr key={doc.id} className="hover:bg-accent/50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 font-medium group-hover:text-primary transition-colors">{doc.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{doc.type}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {doc.expirationDate ? new Date(doc.expirationDate).toLocaleDateString('fr-FR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
