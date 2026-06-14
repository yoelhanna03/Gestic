import React from "react";
import {
  FaFileAlt,
  FaBell,
  FaUsers,
  FaShieldAlt,
  FaExclamationTriangle,
  FaStar,
} from "react-icons/fa";
import Link from "next/link";
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
  let favoriteCount = 0;
  let expiring7DaysCount = 0;
  let expiring30DaysCount = 0;
  let recentDocs: any[] = [];
  let recentAlerts: any[] = [];
  let typeBreakdown: any[] = [];
  let subscription: any = null;

  const now = new Date();
  const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (familyId) {
    [
      documentsCount,
      favoriteCount,
      alertsCount,
      expiring7DaysCount,
      expiring30DaysCount,
      membersCount,
      recentDocs,
      recentAlerts,
      typeBreakdown,
      subscription,
    ] = await Promise.all([
      prisma.document.count({ where: { familyId } }),
      prisma.document.count({ where: { familyId, isFavorite: true } }),
      prisma.alert.count({
        where: {
          isRead: false,
          document: { familyId },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
        },
      }),
      prisma.document.count({
        where: {
          familyId,
          expirationDate: { gte: now, lte: next7Days },
        },
      }),
      prisma.document.count({
        where: {
          familyId,
          expirationDate: { gte: now, lte: next30Days },
        },
      }),
      prisma.user.count({ where: { familyId } }),
      prisma.document.findMany({
        where: { familyId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.alert.findMany({
        where: {
          isRead: false,
          document: { familyId },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
        },
        include: { document: true },
        orderBy: { triggerDate: "asc" },
        take: 3,
      }),
      prisma.document.groupBy({
        by: ["type"],
        _count: { type: true },
        where: { familyId },
      }),
      prisma.subscription.findUnique({ where: { familyId } }),
    ]);
  } else {
    // If user has no family in session yet, fall back to user-scoped queries
    [
      documentsCount,
      favoriteCount,
      alertsCount,
      expiring7DaysCount,
      expiring30DaysCount,
      membersCount,
      recentDocs,
      recentAlerts,
      typeBreakdown,
    ] = await Promise.all([
      prisma.document.count({ where: { userId: user.id } }),
      prisma.document.count({ where: { userId: user.id, isFavorite: true } }),
      prisma.alert.count({
        where: {
          isRead: false,
          document: { userId: user.id },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
        },
      }),
      prisma.document.count({
        where: {
          userId: user.id,
          expirationDate: { gte: now, lte: next7Days },
        },
      }),
      prisma.document.count({
        where: {
          userId: user.id,
          expirationDate: { gte: now, lte: next30Days },
        },
      }),
      prisma.user.count({ where: { id: user.id } }),
      prisma.document.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.alert.findMany({
        where: {
          isRead: false,
          document: { userId: user.id },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
        },
        include: { document: true },
        orderBy: { triggerDate: "asc" },
        take: 3,
      }),
      prisma.document.groupBy({
        by: ["type"],
        _count: { type: true },
        where: { userId: user.id },
      }),
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
      label: "Favoris",
      value: String(favoriteCount),
      icon: <FaStar />,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      label: "Alertes actives",
      value: String(alertsCount),
      icon: <FaBell />,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Plan",
      value: subscription?.plan ?? "FREE",
      icon: <FaShieldAlt />,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
  ];

  function getSeverity(expirationDate: string | null) {
    if (!expirationDate)
      return { label: "Info", color: "blue", bgColor: "sky" };
    const exp = new Date(expirationDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) return { label: "Expiré", color: "red", bgColor: "red" };
    if (diffDays <= 7)
      return { label: "Critique", color: "orange", bgColor: "amber" };
    if (diffDays <= 30)
      return { label: "Important", color: "amber", bgColor: "amber" };
    return { label: "Info", color: "blue", bgColor: "sky" };
  }

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

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Vue rapide</h2>
              <p className="text-sm text-muted-foreground">
                Actions et échéances importantes pour votre coffre-fort.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/documents/new"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
              >
                Nouveau document
              </Link>
              <Link
                href="/dashboard/alerts"
                className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted/80 transition"
              >
                Voir les alertes
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-3">
                À venir 7 jours
              </div>
              <div className="text-3xl font-bold">{expiring7DaysCount}</div>
              <div className="text-sm text-muted-foreground mt-2">
                documents expirant bientôt.
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-3">
                À venir 30 jours
              </div>
              <div className="text-3xl font-bold">{expiring30DaysCount}</div>
              <div className="text-sm text-muted-foreground mt-2">
                documents à surveiller.
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-3">
                Favoris
              </div>
              <div className="text-3xl font-bold">{favoriteCount}</div>
              <div className="text-sm text-muted-foreground mt-2">
                documents épinglés.
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <h3 className="text-lg font-bold mb-4">Catégories principales</h3>
          <div className="space-y-3">
            {typeBreakdown.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Aucune catégorie disponible.
              </div>
            ) : (
              typeBreakdown.map((group) => (
                <div
                  key={group.type}
                  className="flex items-center justify-between p-3 rounded-xl bg-background border border-border"
                >
                  <span className="text-sm font-medium">{group.type}</span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {group._count.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
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
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="text-amber-600" />
            Alertes récentes
          </h3>
          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Aucune alerte pour le moment.
              </div>
            ) : (
              <>
                {recentAlerts.map((alert: any) => {
                  const doc = alert.document;
                  const sev = getSeverity(doc?.expirationDate ?? null);
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border-2 ${
                        sev.color === "red"
                          ? "border-red-200 bg-red-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <FaExclamationTriangle
                          className={`flex-shrink-0 mt-1 ${
                            sev.color === "red"
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                          size={14}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold line-clamp-1">
                            {doc?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc?.expirationDate
                              ? new Date(doc.expirationDate).toLocaleDateString(
                                  "fr-FR",
                                )
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Link
                  href="/dashboard/alerts"
                  className="w-full inline-block py-2 text-sm font-medium text-primary hover:underline text-center border-t border-border mt-3 pt-3"
                >
                  Voir toutes les alertes ({alertsCount})
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
