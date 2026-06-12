import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (!user.familyId) {
      return NextResponse.json({ error: "No family associated with this user" }, { status: 400 });
    }

    const familyId = user.familyId;

    // Get or create subscription record to store Stripe Customer ID
    let subscription = await prisma.subscription.findUnique({
      where: { familyId },
    });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          familyId,
          plan: 'FREE',
          status: 'active',
        },
      });
    }

    // We use the familyId as client_reference_id to identify the family in the webhook
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_H5Y7fS2pL8K1', // This should be a real Price ID from Stripe Dashboard
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing`,
      client_reference_id: familyId,
      customer_email: user.email,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
