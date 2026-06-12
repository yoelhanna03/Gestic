"use client";

import React from 'react';
import Link from 'next/link';
import { FaTimesCircle, FaArrowLeft } from 'react-icons/fa';

export default function StripeCanceled() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background">
      <div className="max-w-md w-full space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-8">
          <FaTimesCircle size={48} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Paiement annulé</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          C'est dommage ! Vous n'avez pas finalisé votre abonnement Premium, mais vous pouvez toujours profiter des fonctionnalités gratuites de Gestic.
        </p>
        <Link
          href="/dashboard/billing"
          className="block w-full py-4 rounded-xl border-2 border-border font-bold text-lg hover:bg-accent transition-colors"
        >
          Retour aux tarifs
        </Link>
      </div>
    </div>
  );
}
