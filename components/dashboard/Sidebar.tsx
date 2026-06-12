"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaFileAlt, FaBell, FaCog, FaCreditCard } from 'react-icons/fa';

const menuItems = [
  { name: 'Accueil', href: '/dashboard', icon: <FaHome /> },
  { name: 'Documents', href: '/dashboard/documents', icon: <FaFileAlt /> },
  { name: 'Alertes', href: '/dashboard/alerts', icon: <FaBell /> },
  { name: 'Paramètres', href: '/dashboard/settings', icon: <FaCog /> },
  { name: 'Facturation', href: '/dashboard/billing', icon: <FaCreditCard /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 flex items-center gap-2 font-bold text-xl">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
          <FaHome size={16} />
        </div>
        <span className="tracking-tight">Gestic</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
          Plan Premium actif ✅
        </div>
      </div>
    </aside>
  );
}
