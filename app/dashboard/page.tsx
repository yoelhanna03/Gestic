import React from "react";
import {
  FaFileAlt,
  FaBell,
  FaUsers,
  FaShieldAlt,
  FaExclamationTriangle,
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
  let recentDocs: any[] = [];
  let recentAlerts: any[] = [];
  let subscription: any = null;

  if (familyId) {
    [
      documentsCount,
      alertsCount,
      membersCount,
      recentDocs,
      recentAlerts,
      subscription,
    ] = await Promise.all([
      prisma.document.count({ where: { familyId } }),
      prisma.alert.count({
        where: {
          isRead: false,
          document: { familyId },
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }],
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
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }],
        },
        include: { document: true },
        orderBy: { triggerDate: "asc" },
        take: 3,
      }),
      prisma.subscription.findUnique({ where: { familyId } }),
    ]);
  } else {
    // If user has no family in session yet, fall back to user-scoped queries
    [documentsCount, alertsCount, membersCount, recentDocs, recentAlerts] =
      await Promise.all([
        prisma.document.count({ where: { userId: user.id } }),
        prisma.alert.count({
          where: {
            isRead: false,
            document: { userId: user.id },
            OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }],
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
            OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }],
          },
          include: { document: true },
          orderBy: { triggerDate: "asc" },
          take: 3,
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
