import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function SettingsPage() {
  const hdrs = await headers();
  const headersObj = Object.fromEntries(hdrs.entries());
  const session = await auth.api.getSession({ headers: headersObj });
  if (!session) redirect("/auth/signin");

  const user = session.user as any;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  return (
    <div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Modifiez les informations de votre profil et les préférences du foyer.
        </p>
      </div>

      <div className="mt-6 bg-card p-6 rounded-2xl border border-border shadow-sm max-w-2xl">
        <form
          id="profile-form"
          action="/api/user/update"
          method="post"
          className="space-y-4"
        >
          <input type="hidden" name="_action" value="updateProfile" />
          <div>
            <label className="text-sm font-medium">Nom</label>
            <input
              type="text"
              name="name"
              defaultValue={dbUser?.name || ""}
              className="w-full p-2 rounded-md border border-border bg-background text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={dbUser?.email || ""}
              className="w-full p-2 rounded-md border border-border bg-background text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notifications</label>
            <select
              name="notifications"
              defaultValue={
                (dbUser as any)?.notificationsEnabled ? "enabled" : "disabled"
              }
              className="w-full p-2 rounded-md border border-border bg-background text-sm"
            >
              <option value="enabled">Activées</option>
              <option value="disabled">Désactivées</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
