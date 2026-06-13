import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import ProfileForm from "@/components/dashboard/ProfileForm";

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
        {/* Client-side form to avoid full-page redirect */}
        <ProfileForm user={dbUser} />
      </div>
    </div>
  );
}
