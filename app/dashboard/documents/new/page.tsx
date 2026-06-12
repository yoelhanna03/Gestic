"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { documentSchema, DocumentInput } from '@/lib/validations/document';
import { FaSave } from 'react-icons/fa';

export default function NewDocumentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
  });

  async function onSubmit(data: DocumentInput) {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(await res.text());

      setMessage({ type: 'success', text: 'Document enregistré avec succès !' });
      reset();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Une erreur est survenue' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Ajouter un document</h1>
        <p className="text-muted-foreground">Enregistrez un nouveau contrat ou papier administratif dans votre coffre-fort.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Nom */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom du document</label>
            <input
              {...register('name')}
              placeholder="Ex: Contrat Assurance Habitation"
              className={`w-full p-2 rounded-md border ${errors.name ? 'border-red-500' : 'border-border'} bg-background`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Catégorie</label>
            <select
              {...register('type')}
              className="w-full p-2 rounded-md border border-border bg-background"
            >
              <option value="CONTRACT">Contrat</option>
              <option value="INVOICE">Facture</option>
              <option value="INSURANCE">Assurance</option>
              <option value="IDENTITY">Identité</option>
              <option value="TAX">Fiscalité</option>
              <option value="OTHER">Autre</option>
            </select>
            {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
          </div>

          {/* URL Fichier (Simulé) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Lien vers le document (URL)</label>
            <input
              {...register('fileUrl')}
              placeholder="https://storage.familiSafe.com/doc123.pdf"
              className={`w-full p-2 rounded-md border ${errors.fileUrl ? 'border-red-500' : 'border-border'} bg-background`}
            />
            {errors.fileUrl && <p className="text-xs text-red-500">{errors.fileUrl.message}</p>}
          </div>

          {/* Date d'expiration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date d'expiration (Optionnel)</label>
            <input
              type="date"
              {...register('expirationDate')}
              className="w-full p-2 rounded-md border border-border bg-background"
            />
            {errors.expirationDate && <p className="text-xs text-red-500">{errors.expirationDate.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Notes additionnelles sur ce document..."
              className="w-full p-2 rounded-md border border-border bg-background"
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
          >
            <FaSave />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le document'}
          </button>
        </div>
      </form>
    </div>
  );
}
