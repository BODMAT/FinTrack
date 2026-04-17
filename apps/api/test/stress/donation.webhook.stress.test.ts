import { jest } from "@jest/globals";

class MockKnownRequestError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

describe("Stripe webhook idempotency stress", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("handles duplicate webhook bursts without failing", async () => {
    const seen = new Set<string>();

    jest.unstable_mockModule("@prisma/client", () => ({
      Prisma: {
        PrismaClientKnownRequestError: MockKnownRequestError,
      },
    }));

    jest.unstable_mockModule("../../src/config/env.js", () => ({
      ENV: {
        STRIPE_SECRET_KEY: "sk_test_123",
        STRIPE_WEBHOOK_SECRET: "whsec_123",
        STRIPE_DONATION_PRICE_ID: "",
        STRIPE_DONATION_SUCCESS_URL: "https://app.fintrack.dev/success",
        STRIPE_DONATION_CANCEL_URL: "https://app.fintrack.dev/cancel",
        STRIPE_DONATION_CURRENCY: "usd",
        STRIPE_DONATION_AMOUNT: 500,
        STRIPE_DONATION_DURATION_DAYS: 30,
      },
    }));

    jest.unstable_mockModule("../../src/utils/authSecurity.js", () => ({
      logSecurityEvent: jest.fn(),
    }));

    jest.unstable_mockModule("../../src/prisma/client.js", () => ({
      prisma: {
        stripeWebhookEvent: {
          create: async (args: { data: { stripeEventId: string } }) => {
            const id = args.data.stripeEventId;
            if (seen.has(id)) {
              throw new MockKnownRequestError("P2002");
            }

            seen.add(id);
            // Add jitter to create interleaving after the first write
            await new Promise((resolve) =>
              setTimeout(resolve, Math.floor(Math.random() * 5)),
            );
            return { id };
          },
        },
      },
    }));

    jest.unstable_mockModule("stripe", () => ({
      default: class Stripe {
        webhooks = {
          constructEvent: () => ({
            id: "evt_same_id",
            type: "product.created",
            data: {
              object: {},
            },
          }),
        };

        constructor() {
          // no-op
        }
      },
    }));

    const { processStripeWebhook } =
      await import("../../src/modules/donation/service.js");

    const runs = 30;
    const results = await Promise.all(
      Array.from({ length: runs }, () =>
        processStripeWebhook(Buffer.from("{}"), "sig_123"),
      ),
    );

    const duplicateTrue = results.filter((r) => r.duplicate === true).length;
    const duplicateFalse = results.filter((r) => r.duplicate === false).length;

    expect(duplicateFalse).toBe(1);
    expect(duplicateTrue).toBe(runs - 1);
    expect(results.every((r) => r.received === true)).toBe(true);
  });
});
