"use client";

import React from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';

export default function StripeSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background">
      <div className="max-w-md w-full space-y-6">
        <div className="mx-auto w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8">
          <FaCheckCircle size={48} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Merci pour votre confiance !</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Votre abonnement Premium Gestic est maintenant actif. Vous avez désormais un accès illimité au stockage et à toutes les fonctionnalités avancées.
        </p>
        <Link
          href="/dashboard"
          className="block w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
        >
          Accéder à mon Dashboard
        </Link>
      </div>
    </div>
  );
}
