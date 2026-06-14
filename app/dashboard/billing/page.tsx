import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import PortalButton from "./PortalButton";

const prisma = new PrismaClient();

export default async function BillingPage() {
  const hdrs = await headers();
  const headersObj = Object.fromEntries(hdrs.entries());
  const session = await auth.api.getSession({ headers: headersObj });
  if (!session) redirect("/auth/signin");

  const user = session.user as any;
  const familyId = user.familyId;

  let subscription: any = null;
  if (familyId) {
    try {
      subscription = await prisma.subscription.findUnique({
        where: { familyId },
      });
    } catch (err) {
      // Log and swallow to avoid crashing the page in production
      console.error("[Billing] prisma.subscription.findUnique failed:", err);
      subscription = null;
    }
  } else {
    console.warn(
      "[Billing] user has no familyId; skipping subscription lookup",
    );
  }

  const hasStripeCustomer = !!subscription?.stripeCustomerId;
  const actionMode = hasStripeCustomer ? "portal" : "checkout";
  const actionLabel = hasStripeCustomer
    ? "Accéder au portail de facturation"
    : "Passer au Premium";
  const actionMessage = hasStripeCustomer
    ? "Gérez votre abonnement et consultez vos factures Stripe."
    : familyId
      ? "Aucun abonnement Stripe n'est associé à votre compte. Passez au Premium pour en créer un."
      : "Votre famille sera créée automatiquement lorsque vous passerez au Premium.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturation</h1>
        <p className="text-muted-foreground">{actionMessage}</p>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm max-w-2xl">
        <div className="mb-4">
          <div className="text-sm text-muted-foreground">Plan actuel</div>
          <div className="text-xl font-bold">
            {subscription?.plan ?? "FREE"}
          </div>
        </div>

        <div className="space-y-4">
          <PortalButton mode={actionMode} label={actionLabel} />
          {!hasStripeCustomer && (
            <div className="text-sm text-muted-foreground">
              En passant au Premium, vous pourrez stocker plus de documents et
              gérer vos factures via Stripe.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
