import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_secret"
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const session = event.data.object as any;
  const familyId = session.client_reference_id;

  if (!familyId) {
    return NextResponse.json({ error: "No familyId found in session" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await prisma.subscription.upsert({
        where: { familyId },
        update: {
          plan: "PREMIUM",
          status: "active",
          stripeCustomerId: session.customer,
        },
        create: {
          familyId,
          plan: "PREMIUM",
          status: "active",
          stripeCustomerId: session.customer,
        },
      });
      break;

    case "customer.subscription.deleted":
      await prisma.subscription.update({
        where: { familyId },
        data: {
          plan: "FREE",
          status: "inactive",
        },
      });
      break;

    case "invoice.payment_succeeded":
      // Ensure the subscription remains active after successful renewal
      await prisma.subscription.update({
        where: { familyId },
        data: { status: "active" },
      });
      break;
  }

  return NextResponse.json({ received: true });
}
