import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AlertsPage() {
  const hdrs = await headers();
  const headersObj = Object.fromEntries(hdrs.entries());
  const session = await auth.api.getSession({ headers: headersObj });
  if (!session) redirect("/auth/signin");

  const user = session.user as any;
  const familyId = user.familyId;

  const cutoff = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

  const alerts = await prisma.document.findMany({
    where: {
      familyId,
      expirationDate: { lte: cutoff },
    },
    orderBy: { expirationDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
        <p className="text-muted-foreground">
          Documents expirés ou proches de l'expiration.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="p-6 rounded-2xl bg-card border border-border text-sm text-muted-foreground">
          Aucune alerte pour le moment.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr className="text-xs uppercase tracking-wider">
                <th className="px-6 py-3">Document</th>
                <th className="px-6 py-3">Catégorie</th>
                <th className="px-6 py-3">Expiration</th>
                <th className="px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alerts.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium">{doc.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {doc.type}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {doc.expirationDate
                      ? new Date(doc.expirationDate).toLocaleDateString("fr-FR")
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    {doc.expirationDate &&
                    new Date(doc.expirationDate) < new Date() ? (
                      <span className="text-red-600 font-bold">Expiré</span>
                    ) : (
                      <span className="text-amber-600 font-bold">
                        Expire bientôt
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
