import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { ENV } from "../../config/env.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../middleware/errorHandler.js";
import { logSecurityEvent } from "../../utils/authSecurity.js";

const DONATION_CURRENCY = (ENV.STRIPE_DONATION_CURRENCY ?? "usd").toLowerCase();
const DONATION_AMOUNT = ENV.STRIPE_DONATION_AMOUNT;
const DONATION_DURATION_DAYS = ENV.STRIPE_DONATION_DURATION_DAYS;

type CheckoutSessionLike = {
  id: string;
  metadata?: Record<string, string> | null;
  payment_status?: string | null;
  payment_intent?: string | object | null;
  amount_total?: number | null;
  currency?: string | null;
};

let stripeClient: ReturnType<typeof initStripeClient> | null = null;

function initStripeClient() {
  return new Stripe(ENV.STRIPE_SECRET_KEY);
}

type CheckoutSessionCreateParams = Parameters<
  ReturnType<typeof initStripeClient>["checkout"]["sessions"]["create"]
>[0];

function getStripeClient() {
  if (!ENV.STRIPE_SECRET_KEY) {
    throw new AppError("Stripe is not configured", 503);
  }

  if (!stripeClient) {
    stripeClient = initStripeClient();
  }

  return stripeClient;
}

function getDonationExpiryDate(): Date | null {
  if (!DONATION_DURATION_DAYS || DONATION_DURATION_DAYS <= 0) return null;

  const expires = new Date();
  expires.setDate(expires.getDate() + DONATION_DURATION_DAYS);
  return expires;
}

async function ensureStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      stripeCustomerId: true,
      authMethods: {
        where: { type: "EMAIL" },
        select: { email: true },
        take: 1,
      },
    },
  });

  if (!user) throw new AppError("User not found", 404);
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripeClient();
  const email = user.authMethods[0]?.email ?? undefined;

  const customer = await stripe.customers.create({
    name: user.name,
    ...(email ? { email } : {}),
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

function buildCheckoutSessionParams(
  userId: string,
  customerId: string,
): CheckoutSessionCreateParams {
  const base = {
    mode: "payment" as const,
    customer: customerId,
    success_url: ENV.STRIPE_DONATION_SUCCESS_URL,
    cancel_url: ENV.STRIPE_DONATION_CANCEL_URL,
    metadata: {
      userId,
      type: "donation",
    },
    payment_intent_data: {
      metadata: {
        userId,
        type: "donation",
      },
    },
  } satisfies Omit<CheckoutSessionCreateParams, "line_items">;

  if (ENV.STRIPE_DONATION_PRICE_ID) {
    return {
      ...base,
      line_items: [{ price: ENV.STRIPE_DONATION_PRICE_ID, quantity: 1 }],
    };
  }

  if (!DONATION_AMOUNT || DONATION_AMOUNT <= 0) {
    throw new AppError("Stripe donation amount is not configured", 500);
  }

  return {
    ...base,
    line_items: [
      {
        price_data: {
          currency: DONATION_CURRENCY,
          product_data: {
            name: "FinTrack Donation",
            description: "Donation with unlimited analytics AI access",
          },
          unit_amount: DONATION_AMOUNT,
        },
        quantity: 1,
      },
    ],
  };
}

export async function createDonationCheckoutSession(
  userId: string,
  idempotencyKey?: string,
) {
  if (!ENV.STRIPE_DONATION_SUCCESS_URL || !ENV.STRIPE_DONATION_CANCEL_URL) {
    throw new AppError("Stripe donation URLs are not configured", 500);
  }

  const customerId = await ensureStripeCustomer(userId);
  const stripe = getStripeClient();

  const checkoutSession = await stripe.checkout.sessions.create(
    buildCheckoutSessionParams(userId, customerId),
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  await prisma.donationPayment.upsert({
    where: { stripeCheckoutSessionId: checkoutSession.id },
    create: {
      userId,
      stripeCheckoutSessionId: checkoutSession.id,
      stripePaymentIntentId:
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : null,
      amount: checkoutSession.amount_total ?? null,
      currency: checkoutSession.currency ?? null,
      status: "PENDING",
    },
    update: {
      userId,
      stripePaymentIntentId:
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : null,
      amount: checkoutSession.amount_total ?? null,
      currency: checkoutSession.currency ?? null,
      status: "PENDING",
    },
  });

  return {
    checkoutUrl: checkoutSession.url,
    checkoutSessionId: checkoutSession.id,
  };
}

export interface DonationLeaderboardItem {
  userId: string;
  name: string;
  photoUrl: string | null;
  totalAmountMinor: number;
  currency: string;
}

export async function getDonationLeaderboard(
  limit = 20,
): Promise<DonationLeaderboardItem[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const fallbackCurrency = (
    ENV.STRIPE_DONATION_CURRENCY ?? "usd"
  ).toLowerCase();

  const rows = await prisma.$queryRaw<DonationLeaderboardItem[]>`
    SELECT
      u.id AS "userId",
      u.name AS "name",
      u.photo_url AS "photoUrl",
      SUM(dp.amount)::int AS "totalAmountMinor",
      LOWER(COALESCE(MAX(dp.currency), ${fallbackCurrency})) AS "currency"
    FROM "DonationPayment" dp
    INNER JOIN "User" u ON u.id = dp."userId"
    WHERE dp.status = 'SUCCEEDED'
      AND dp.amount IS NOT NULL
      AND dp.amount > 0
    GROUP BY u.id, u.name, u.photo_url
    ORDER BY SUM(dp.amount) DESC, MAX(dp."completedAt") DESC NULLS LAST
    LIMIT ${safeLimit}
  `;

  return rows;
}

async function markDonationSucceeded(session: CheckoutSessionLike) {
  const stripeCheckoutSessionId = session.id;

  const payment = await prisma.donationPayment.findUnique({
    where: { stripeCheckoutSessionId },
    select: { userId: true },
  });

  const userId = session.metadata?.userId ?? payment?.userId;
  if (!userId) {
    throw new AppError("Unable to resolve user for Stripe session", 400);
  }

  const expiresAt = getDonationExpiryDate();

  await prisma.$transaction(async (tx) => {
    await tx.donationPayment.upsert({
      where: { stripeCheckoutSessionId },
      create: {
        userId,
        stripeCheckoutSessionId,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        amount: session.amount_total ?? null,
        currency: session.currency ?? null,
        status: "SUCCEEDED",
        completedAt: new Date(),
      },
      update: {
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        amount: session.amount_total ?? null,
        currency: session.currency ?? null,
        status: "SUCCEEDED",
        completedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        donationStatus: "ACTIVE",
        donationGrantedAt: new Date(),
        donationExpiresAt: expiresAt,
      },
    });
  });

  logSecurityEvent("stripe.donation.activated", {
    userId,
    stripeCheckoutSessionId,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null,
  });
}

async function markDonationCanceled(session: CheckoutSessionLike) {
  await prisma.donationPayment.updateMany({
    where: { stripeCheckoutSessionId: session.id },
    data: {
      status: "CANCELED",
    },
  });
}

export async function processStripeWebhook(payload: Buffer, signature: string) {
  if (!ENV.STRIPE_WEBHOOK_SECRET) {
    throw new AppError("Stripe webhook secret is not configured", 500);
  }

  const stripe = getStripeClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      ENV.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    throw new AppError("Invalid Stripe webhook signature", 400);
  }

  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { received: true, duplicate: true };
    }
    throw error;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      await markDonationSucceeded(session);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    await markDonationCanceled(session);
  }

  return { received: true, duplicate: false };
}
