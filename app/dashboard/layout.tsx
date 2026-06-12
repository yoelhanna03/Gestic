import React from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header>
          <div className="flex items-center gap-2">
            <span>Dashboard</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">Vue d'ensemble</span>
          </div>
        </Header>
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {children}
        </main>
      </div}
    </div>
  );
}
