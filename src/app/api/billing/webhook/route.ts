import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/billing/webhook
 *
 * Handles incoming webhooks from PayPal / Stripe to:
 *  - Renew subscriptions on successful billing
 *  - Cancel subscriptions on failed payment / user request
 *  - Flip user role to/from PREMIUM accordingly
 *
 * Set this URL in your PayPal webhook dashboard and Stripe webhook settings.
 * Verify the signature header to ensure legitimacy.
 */
export async function POST(req: NextRequest) {
  // Verify webhook secret (set WEBHOOK_SECRET in .env.local)
  const secret = req.headers.get("x-webhook-secret");
  const paypalEvent = req.headers.get("paypal-transmission-id"); // PayPal-specific
  const stripeSignature = req.headers.get("stripe-signature");   // Stripe-specific

  const isPayPal = !!paypalEvent;
  const isStripe = !!stripeSignature;

  // Simple shared-secret verification (replace with SDK signature check in production)
  if (!isPayPal && !isStripe && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (body.event_type ?? body.type) as string;

  try {
    switch (eventType) {
      // --- PayPal ---
      case "BILLING.SUBSCRIPTION.RENEWED":
      case "PAYMENT.SALE.COMPLETED": {
        const resource = body.resource as Record<string, unknown>;
        const subscriptionId = (resource?.id ?? resource?.billing_agreement_id) as string;
        if (!subscriptionId) break;
        await renewSubscription(subscriptionId);
        break;
      }

      // --- Stripe ---
      case "invoice.payment_succeeded": {
        const data = (body.data as Record<string, unknown>)?.object as Record<string, unknown>;
        const subId = data?.subscription as string;
        if (subId) await renewSubscription(subId);
        break;
      }

      case "customer.subscription.deleted":
      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const resource = body.resource as any;
        const subId = (resource?.id ?? (body.data as any)?.object?.id) as string;
        if (subId) await cancelSubscription(subId);
        break;
      }

      case "invoice.payment_failed": {
        const data = (body.data as Record<string, unknown>)?.object as Record<string, unknown>;
        const subId = data?.subscription as string;
        if (subId) await markPastDue(subId);
        break;
      }

      default:
        // Unhandled event type — acknowledge without error
        console.log("[webhook] unhandled event:", eventType);
    }
  } catch (err) {
    console.error("[webhook] processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function renewSubscription(externalId: string) {
  const sub = await (prisma.subscription as any).findFirst({ where: { externalId } });
  if (!sub) return;

  const newEnd = new Date(sub.endDate ?? new Date());
  if (sub.plan === "PREMIUM") {
    // Add 1 billing cycle
    newEnd.setMonth(newEnd.getMonth() + 1);
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "ACTIVE", endDate: newEnd },
  });

  await prisma.user.update({
    where: { id: sub.userId },
    data: { role: "PREMIUM" },
  });

  console.log(`[billing] Renewed subscription ${externalId} → new end: ${newEnd.toISOString()}`);
}

async function cancelSubscription(externalId: string) {
  const sub = await (prisma.subscription as any).findFirst({ where: { externalId } });
  if (!sub) return;

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELLED" },
  });

  await prisma.user.update({
    where: { id: sub.userId },
    data: { role: "USER" },
  });

  console.log(`[billing] Cancelled subscription ${externalId}`);
}

async function markPastDue(externalId: string) {
  const sub = await (prisma.subscription as any).findFirst({ where: { externalId } });
  if (!sub) return;

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "PAST_DUE" },
  });

  console.log(`[billing] Marked past-due: ${externalId}`);
}
