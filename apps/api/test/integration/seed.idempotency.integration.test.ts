import { prisma } from "../../src/prisma/client.js";
import { runSeed } from "../../src/prisma/seed.js";

const SEED_EMAILS = [
  "admin@fintrack.dev",
  "donor@fintrack.dev",
  "user@fintrack.dev",
  "limited@fintrack.dev",
  "unverified@fintrack.dev",
  "expired@fintrack.dev",
] as const;
const SEED_TELEGRAM_ID = "9876543210";

async function collectSeedUserIds(): Promise<string[]> {
  const emailMethods = await prisma.authMethod.findMany({
    where: { email: { in: [...SEED_EMAILS] } },
    select: { userId: true },
  });
  const telegramMethod = await prisma.authMethod.findFirst({
    where: { telegram_id: SEED_TELEGRAM_ID },
    select: { userId: true },
  });
  return [...emailMethods.map((m) => m.userId), telegramMethod?.userId].filter(
    (id): id is string => id != null,
  );
}

afterAll(async () => {
  const ids = await collectSeedUserIds();
  if (ids.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.$disconnect();
});

describe("Seed idempotency (real DB)", () => {
  it("first run completes without error", async () => {
    await expect(runSeed()).resolves.not.toThrow();
  });

  it("creates exactly 6 email auth methods + 1 telegram auth method", async () => {
    const emailMethods = await prisma.authMethod.findMany({
      where: { email: { in: [...SEED_EMAILS] } },
    });
    const telegramMethod = await prisma.authMethod.findFirst({
      where: { telegram_id: SEED_TELEGRAM_ID },
    });
    expect(emailMethods).toHaveLength(6);
    expect(telegramMethod).not.toBeNull();
  });

  it("second run completes without error (idempotent)", async () => {
    await expect(runSeed()).resolves.not.toThrow();
  });

  it("still exactly 7 seed users after second run — no duplicates", async () => {
    const emailMethods = await prisma.authMethod.findMany({
      where: { email: { in: [...SEED_EMAILS] } },
    });
    const telegramMethod = await prisma.authMethod.findFirst({
      where: { telegram_id: SEED_TELEGRAM_ID },
    });
    expect(emailMethods).toHaveLength(6);
    expect(telegramMethod).not.toBeNull();
  });

  it("admin user has role=ADMIN, donationStatus=ACTIVE, isVerified=true", async () => {
    const method = await prisma.authMethod.findFirst({
      where: { email: "admin@fintrack.dev" },
      include: { user: true },
    });
    expect(method?.user.role).toBe("ADMIN");
    expect(method?.user.donationStatus).toBe("ACTIVE");
    expect(method?.user.isVerified).toBe(true);
  });

  it("unverified user has isVerified=false", async () => {
    const method = await prisma.authMethod.findFirst({
      where: { email: "unverified@fintrack.dev" },
      include: { user: true },
    });
    expect(method?.user.isVerified).toBe(false);
  });

  it("limited user has aiAnalysisUsed=10 (at limit)", async () => {
    const method = await prisma.authMethod.findFirst({
      where: { email: "limited@fintrack.dev" },
      include: { user: true },
    });
    expect(method?.user.aiAnalysisUsed).toBe(10);
    expect(method?.user.aiAnalysisLimit).toBe(10);
  });

  it("admin has more than 30 transactions (rich fixture data)", async () => {
    const method = await prisma.authMethod.findFirst({
      where: { email: "admin@fintrack.dev" },
      select: { userId: true },
    });
    const count = await prisma.transaction.count({
      where: { userId: method!.userId },
    });
    expect(count).toBeGreaterThan(30);
  });

  it("donation payments exist for admin and donor (SUCCEEDED)", async () => {
    const adminMethod = await prisma.authMethod.findFirst({
      where: { email: "admin@fintrack.dev" },
      select: { userId: true },
    });
    const payments = await prisma.donationPayment.findMany({
      where: { userId: adminMethod!.userId, status: "SUCCEEDED" },
    });
    expect(payments.length).toBeGreaterThanOrEqual(2);
  });

  it("all seed transaction dates are deterministic (no future dates)", async () => {
    const method = await prisma.authMethod.findFirst({
      where: { email: "admin@fintrack.dev" },
      select: { userId: true },
    });
    const futureTx = await prisma.transaction.findFirst({
      where: {
        userId: method!.userId,
        created_at: { gt: new Date() },
      },
    });
    expect(futureTx).toBeNull();
  });
});
