"use client";

import React from 'react';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

export function Header({ children }: { children: React.ReactNode }) {
  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {children}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FaUserCircle className="text-xl text-muted-foreground" />
          <span>Yoel Admin</span>
        </div>
        <button
          onClick={() => console.log('Logout')}
          className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
          title="Déconnexion"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
}
