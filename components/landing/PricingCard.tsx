"use client";

import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';

export function PricingCard({ plan, price, features, cta, highlight }: { plan: string, price: string, features: string[], cta: string, highlight: boolean }) {
  const isPremium = plan === "Premium";

  return (
    <div className={`p-8 rounded-2xl border-2 ${highlight ? 'border-primary shadow-xl' : 'border-border'} relative bg-card`}>
      {highlight && <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase">Recommandé</span>}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2">{plan}</h3>
        <div className="text-4xl font-extrabold mb-4">{price}</div>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
            <FaCheckCircle className="text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      {isPremium ? (
        <button
          onClick={async () => {
            const res = await fetch('/api/stripe/checkout', { method: 'POST' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else alert("Veuillez vous connecter pour souscrire au plan Premium");
          }}
          className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-colors ${highlight ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >
          {cta}
        </button>
      ) : (
        <Link href="/auth/signup" className={`block text-center px-6 py-3 rounded-lg font-semibold transition-colors ${highlight ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
          {cta}
        </Link>
      )}
    </div>
  );
}
