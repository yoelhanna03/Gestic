import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground mb-2">
            <FaShieldAlt size={24} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestic</h1>
          <p className="text-muted-foreground">Sécurisez vos documents familiaux</p>
        </div>
        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
