import React from "react";
import { FaFileAlt, FaBell, FaUsers, FaShieldAlt } from "react-icons/fa";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const hdrs = await headers();
  const headersObj = Object.fromEntries(hdrs.entries());
  const session = await auth.api.getSession({ headers: headersObj });
  if (!session) redirect("/auth/signin");

  const user = session.user as any;
  const familyId = user.familyId;

  let documentsCount = 0;
  let alertsCount = 0;
  let membersCount = 0;
  let recentDocs: any[] = [];
  let subscription: any = null;

  if (familyId) {
    [documentsCount, alertsCount, membersCount, recentDocs, subscription] =
      await Promise.all([
        prisma.document.count({ where: { familyId } }),
        prisma.document.count({
          where: {
            familyId,
            expirationDate: {
              lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            },
          },
        }),
        prisma.user.count({ where: { familyId } }),
        prisma.document.findMany({
          where: { familyId },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        prisma.subscription.findUnique({ where: { familyId } }),
      ]);
  } else {
    // If user has no family in session yet, fall back to user-scoped queries so newly created documents are visible
    [documentsCount, alertsCount, membersCount, recentDocs, subscription] =
      await Promise.all([
        prisma.document.count({ where: { userId: user.id } }),
        prisma.alert.count({
          where: { document: { userId: user.id }, isSent: false },
        }),
        prisma.user.count({ where: { id: user.id } }),
        prisma.document.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        null,
      ]);
    subscription = null;
  }

  const stats = [
    {
      label: "Documents stockés",
      value: String(documentsCount),
      icon: <FaFileAlt />,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Alertes actives",
      value: String(alertsCount),
      icon: <FaBell />,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Membres famille",
      value: String(membersCount),
      icon: <FaUsers />,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Plan",
      value: subscription?.plan ?? "FREE",
      icon: <FaShieldAlt />,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenue, {user.name ?? "membre"} 👋
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre coffre-fort familial.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-card border border-border shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase">
                Statut
              </span>
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
            {recentDocs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Aucun document récent.
              </div>
            ) : (
              recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted text-muted-foreground">
                      <FaFileAlt size={14} />
                    </div>
                    <span className="text-sm font-medium">{doc.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.updatedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <h3 className="text-lg font-bold mb-4">Échéances proches</h3>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Vous avez {alertsCount} document(s) expiré(s) ou proche(s)
              d'expiration.
            </div>
            <a
              href="/dashboard/alerts"
              className="w-full inline-block py-2 text-sm font-medium text-primary hover:underline text-center"
            >
              Voir toutes les alertes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
