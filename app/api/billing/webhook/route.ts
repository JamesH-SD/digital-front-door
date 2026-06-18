import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

type StripeSubscriptionLike = {
  id: string;
  customer: string;
  status: string;
  metadata?: Record<string, string>;
  trial_end?: number | null;
  current_period_end?: number | null;
  cancel_at_period_end?: boolean | null;
  canceled_at?: number | null;
  items?: {
    data?: Array<{
      price?: {
        id?: string;
      };
    }>;
  };
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook error" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  async function syncSubscription(subscription: StripeSubscriptionLike) {

    const tenantSlug = subscription.metadata?.tenantSlug;

    if (!tenantSlug) return;

    const priceId = subscription.items?.data?.[0]?.price?.id || null;

    const { error } = await supabase.from("tenant_billing").upsert(
      {
        tenant_slug: tenantSlug,
        stripe_customer_id: String(subscription.customer),
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        price_id: priceId,
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
          cancel_at_period_end: Boolean(
            subscription.cancel_at_period_end || (subscription as any).canceled_at
          ),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_slug" }
    );
    
    if (error) {
      console.error("Stripe webhook tenant_billing update failed:", error);
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (
      typeof session.subscription === "string"
    ) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      await syncSubscription(subscription as unknown as StripeSubscriptionLike);
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscriptionObject = event.data.object as any;

    const subscription = await stripe.subscriptions.retrieve(
      subscriptionObject.id
    );

    await syncSubscription(subscription as unknown as StripeSubscriptionLike);
  }

  return NextResponse.json({ received: true });
}