import React from 'react';
import { FaFileAlt, FaBell, FaUsers, FaShieldAlt } from 'react-icons/fa';

export default function DashboardPage() {
  const stats = [
    { label: 'Documents stockés', value: '24', icon: <FaFileAlt />, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Alertes actives', value: '3', icon: <FaBell />, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Membres famille', value: '4', icon: <FaUsers />, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Sécurité', value: 'Optimale', icon: <FaShieldAlt />, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bienvenue, Yoel 👋</h1>
        <p className="text-muted-foreground">Voici un aperçu de votre coffre-fort familial.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase">Statut</span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm">
          <h3 className="text-lg font-bold mb-4">Documents récents</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted text-muted-foreground">
                    <FaFileAlt size={14} />
                  </div>
                  <span className="text-sm font-medium">Contrat Assurance Habitation {i+1}.pdf</span>
                </div>
                <span className="text-xs text-muted-foreground">Modifié il y a 2 jours</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <h3 className="text-lg font-bold mb-4">Échéances proches</h3>
          <div className="space-y-4">
            {[1, 2].map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-amber-50 border-l-4 border-amber-400">
                <div className="text-sm font-bold text-amber-900">Abonnement Internet</div>
                <div className="text-xs text-amber-700">Expire dans 12 jours</div>
              </div>
            ))}
            <button className="w-full py-2 text-sm font-medium text-primary hover:underline text-center">
              Voir toutes les alertes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
