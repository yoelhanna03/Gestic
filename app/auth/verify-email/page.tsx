"use client";

import React from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Vérifiez votre e-mail</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Un e-mail de confirmation a été envoyé à votre adresse. Cliquez sur le
          lien dans ce message pour valider votre compte. Si vous ne voyez rien,
          vérifiez vos spams.
        </p>
        <div className="flex gap-2">
          <Link href="/auth/signin" className="text-primary hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
