import bcrypt from "bcrypt";
import {
  AuthType,
  TransactionType,
  CurrencyCode,
  AiProvider,
} from "@prisma/client";
import { prisma } from "./client.js";
import { encryptApiKey } from "../utils/crypto.js";

// Fixed epoch ensures identical timestamps on every re-run
const SEED_EPOCH = new Date("2026-05-11T12:00:00.000Z");
const hoursAgo = (h: number) => new Date(SEED_EPOCH.getTime() - h * 3_600_000);
const daysAgo = (d: number) => new Date(SEED_EPOCH.getTime() - d * 86_400_000);

const SEED_EMAILS = [
  "admin@fintrack.dev",
  "donor@fintrack.dev",
  "user@fintrack.dev",
  "limited@fintrack.dev",
  "unverified@fintrack.dev",
  "expired@fintrack.dev",
] as const;
const SEED_TELEGRAM_ID = "9876543210";

export async function runSeed(): Promise<void> {
  await prisma.$connect();
  console.log("🌱 Seeding database...");

  // Idempotency: remove stale seed users before re-inserting (cascade cleans children)
  const emailMethods = await prisma.authMethod.findMany({
    where: { email: { in: [...SEED_EMAILS] } },
    select: { userId: true },
  });
  const telegramMethod = await prisma.authMethod.findFirst({
    where: { telegram_id: SEED_TELEGRAM_ID },
    select: { userId: true },
  });
  const staleIds = [
    ...emailMethods.map((m) => m.userId),
    telegramMethod?.userId,
  ].filter((id): id is string => id != null);
  if (staleIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: staleIds } } });
    console.log(`🗑  Removed ${staleIds.length} stale seed users`);
  }

  const saltRounds = 10;
  const password = "11111111";

  // ── Users ────────────────────────────────────────────────────────────────

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      photo_url: "https://i.pravatar.cc/150?img=1",
      isVerified: true,
      role: "ADMIN",
      aiAnalysisUsed: 5,
      aiAnalysisLimit: 999,
      donationStatus: "ACTIVE",
      donationGrantedAt: daysAgo(60),
      authMethods: {
        create: {
          type: AuthType.EMAIL,
          email: "admin@fintrack.dev",
          password_hash: await bcrypt.hash(password, saltRounds),
        },
      },
      apiKeys: {
        create: {
          provider: AiProvider.GROQ,
          apiKey: encryptApiKey("seed-fake-groq-admin"),
          isActive: true,
        },
      },
    },
  });

  const donor = await prisma.user.create({
    data: {
      name: "Donor User",
      photo_url: "https://i.pravatar.cc/150?img=2",
      isVerified: true,
      role: "USER",
      donationStatus: "ACTIVE",
      donationGrantedAt: daysAgo(30),
      aiAnalysisUsed: 0,
      aiAnalysisLimit: 999,
      authMethods: {
        create: {
          type: AuthType.EMAIL,
          email: "donor@fintrack.dev",
          password_hash: await bcrypt.hash(password, saltRounds),
        },
      },
      apiKeys: {
        create: {
          provider: AiProvider.GROQ,
          apiKey: encryptApiKey("seed-fake-groq-donor"),
          isActive: true,
        },
      },
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: "Regular User",
      photo_url: "https://i.pravatar.cc/150?img=3",
      isVerified: true,
      role: "USER",
      aiAnalysisUsed: 7,
      aiAnalysisLimit: 10,
      authMethods: {
        create: {
          type: AuthType.EMAIL,
          email: "user@fintrack.dev",
          password_hash: await bcrypt.hash(password, saltRounds),
        },
      },
      apiKeys: {
        create: {
          provider: AiProvider.GEMINI,
          apiKey: encryptApiKey("seed-fake-gemini-regular"),
          isActive: true,
        },
      },
    },
  });

  const limitedUser = await prisma.user.create({
    data: {
      name: "Limited User",
      photo_url: "https://i.pravatar.cc/150?img=4",
      isVerified: true,
      role: "USER",
      aiAnalysisUsed: 10,
      aiAnalysisLimit: 10,
      authMethods: {
        create: {
          type: AuthType.EMAIL,
          email: "limited@fintrack.dev",
          password_hash: await bcrypt.hash(password, saltRounds),
        },
      },
      apiKeys: {
        create: {
          provider: AiProvider.GROQ,
          apiKey: encryptApiKey("seed-fake-groq-limited"),
          isActive: true,
        },
      },
    },
  });

  const unverifiedUser = await prisma.user.create({
    data: {
      name: "Unverified User",
      isVerified: false,
      role: "USER",
      authMethods: {
        create: {
          type: AuthType.EMAIL,
          email: "unverified@fintrack.dev",
          password_hash: await bcrypt.hash(password, saltRounds),
        },
      },
    },
  });

  const telegramUser = await prisma.user.create({
    data: {
      name: "Telegram User",
      photo_url: "https://i.pravatar.cc/150?img=5",
      isVerified: true,
      role: "USER",
      aiAnalysisUsed: 2,
      aiAnalysisLimit: 10,
      authMethods: {
        create: {
          type: AuthType.TELEGRAM,
          telegram_id: SEED_TELEGRAM_ID,
        },
      },
      apiKeys: {
        create: {
          provider: AiProvider.GEMINI,
          apiKey: encryptApiKey("seed-fake-gemini-telegram"),
          isActive: true,
        },
      },
    },
  });

  const expiredDonor = await prisma.user.create({
    data: {
      name: "Expired Donor",
      photo_url: "https://i.pravatar.cc/150?img=6",
      isVerified: true,
      role: "USER",
      donationStatus: "EXPIRED",
      aiAnalysisUsed: 3,
      aiAnalysisLimit: 10,
      authMethods: {
        create: {
          type: AuthType.EMAIL,
          email: "expired@fintrack.dev",
          password_hash: await bcrypt.hash(password, saltRounds),
        },
      },
      apiKeys: {
        create: {
          provider: AiProvider.GROQ,
          apiKey: encryptApiKey("seed-fake-groq-expired"),
          isActive: true,
        },
      },
    },
  });

  console.log("✅ Users created (7)");

  // ── Admin transactions — rich data for all chart ranges ──────────────────
  // TODAY (for "day" chart — hourly buckets)
  const adminTodayTx = [
    {
      title: "Morning coffee",
      type: TransactionType.EXPENSE,
      amount: 95,
      currency: CurrencyCode.UAH,
      h: 2,
    },
    {
      title: "Freelance payment",
      type: TransactionType.INCOME,
      amount: 1500,
      currency: CurrencyCode.USD,
      h: 4,
    },
    {
      title: "Lunch",
      type: TransactionType.EXPENSE,
      amount: 280,
      currency: CurrencyCode.UAH,
      h: 6,
    },
    {
      title: "Consulting",
      type: TransactionType.INCOME,
      amount: 800,
      currency: CurrencyCode.USD,
      h: 9,
    },
    {
      title: "Taxi",
      type: TransactionType.EXPENSE,
      amount: 180,
      currency: CurrencyCode.UAH,
      h: 11,
    },
    {
      title: "Groceries",
      type: TransactionType.EXPENSE,
      amount: 650,
      currency: CurrencyCode.UAH,
      h: 13,
    },
  ];

  for (const tx of adminTodayTx) {
    await prisma.transaction.create({
      data: {
        title: tx.title,
        type: tx.type,
        amount: tx.amount,
        currencyCode: tx.currency,
        created_at: hoursAgo(tx.h),
        userId: admin.id,
      },
    });
  }

  // THIS WEEK (days 1–6)
  const adminWeekTx = [
    {
      title: "Salary",
      type: TransactionType.INCOME,
      amount: 55000,
      currency: CurrencyCode.UAH,
      d: 1,
      lat: 50.4501,
      lng: 30.5234,
    },
    {
      title: "Restaurant",
      type: TransactionType.EXPENSE,
      amount: 1200,
      currency: CurrencyCode.UAH,
      d: 1,
    },
    {
      title: "Gym",
      type: TransactionType.EXPENSE,
      amount: 800,
      currency: CurrencyCode.UAH,
      d: 2,
      lat: 50.46,
      lng: 30.51,
    },
    {
      title: "Side job",
      type: TransactionType.INCOME,
      amount: 3000,
      currency: CurrencyCode.UAH,
      d: 2,
    },
    {
      title: "Utilities",
      type: TransactionType.EXPENSE,
      amount: 2200,
      currency: CurrencyCode.UAH,
      d: 3,
    },
    {
      title: "Freelance USD",
      type: TransactionType.INCOME,
      amount: 600,
      currency: CurrencyCode.USD,
      d: 3,
    },
    {
      title: "Pharmacy",
      type: TransactionType.EXPENSE,
      amount: 450,
      currency: CurrencyCode.UAH,
      d: 4,
    },
    {
      title: "Courses",
      type: TransactionType.EXPENSE,
      amount: 1500,
      currency: CurrencyCode.UAH,
      d: 4,
    },
    {
      title: "Bonus",
      type: TransactionType.INCOME,
      amount: 5000,
      currency: CurrencyCode.UAH,
      d: 5,
    },
    {
      title: "Clothing",
      type: TransactionType.EXPENSE,
      amount: 2800,
      currency: CurrencyCode.UAH,
      d: 5,
      lat: 50.448,
      lng: 30.53,
    },
    {
      title: "Internet",
      type: TransactionType.EXPENSE,
      amount: 350,
      currency: CurrencyCode.UAH,
      d: 6,
    },
    {
      title: "Dividends",
      type: TransactionType.INCOME,
      amount: 1200,
      currency: CurrencyCode.EUR,
      d: 6,
    },
  ];

  for (const tx of adminWeekTx) {
    await prisma.transaction.create({
      data: {
        title: tx.title,
        type: tx.type,
        amount: tx.amount,
        currencyCode: tx.currency,
        created_at: daysAgo(tx.d),
        userId: admin.id,
        ...(tx.lat && tx.lng
          ? { location: { create: { latitude: tx.lat, longitude: tx.lng } } }
          : {}),
      },
    });
  }

  // THIS MONTH (days 7–29)
  const adminMonthTx = [
    {
      title: "Rent",
      type: TransactionType.EXPENSE,
      amount: 18000,
      currency: CurrencyCode.UAH,
      d: 8,
    },
    {
      title: "Insurance",
      type: TransactionType.EXPENSE,
      amount: 3500,
      currency: CurrencyCode.UAH,
      d: 9,
    },
    {
      title: "Consulting project",
      type: TransactionType.INCOME,
      amount: 2500,
      currency: CurrencyCode.USD,
      d: 10,
    },
    {
      title: "Dentist",
      type: TransactionType.EXPENSE,
      amount: 4200,
      currency: CurrencyCode.UAH,
      d: 11,
      lat: 50.455,
      lng: 30.52,
    },
    {
      title: "Gadgets",
      type: TransactionType.EXPENSE,
      amount: 12000,
      currency: CurrencyCode.UAH,
      d: 13,
    },
    {
      title: "Crypto sale",
      type: TransactionType.INCOME,
      amount: 3000,
      currency: CurrencyCode.USD,
      d: 14,
    },
    {
      title: "Books",
      type: TransactionType.EXPENSE,
      amount: 600,
      currency: CurrencyCode.UAH,
      d: 16,
    },
    {
      title: "Salary 2",
      type: TransactionType.INCOME,
      amount: 55000,
      currency: CurrencyCode.UAH,
      d: 17,
    },
    {
      title: "Cinema",
      type: TransactionType.EXPENSE,
      amount: 320,
      currency: CurrencyCode.UAH,
      d: 18,
      lat: 50.447,
      lng: 30.515,
    },
    {
      title: "Web development",
      type: TransactionType.INCOME,
      amount: 4000,
      currency: CurrencyCode.USD,
      d: 19,
    },
    {
      title: "Repairs",
      type: TransactionType.EXPENSE,
      amount: 8000,
      currency: CurrencyCode.UAH,
      d: 21,
    },
    {
      title: "Partner reward",
      type: TransactionType.INCOME,
      amount: 1500,
      currency: CurrencyCode.EUR,
      d: 23,
    },
    {
      title: "Travel",
      type: TransactionType.EXPENSE,
      amount: 5500,
      currency: CurrencyCode.UAH,
      d: 25,
      lat: 49.8397,
      lng: 24.0297,
    },
    {
      title: "Selling stuff",
      type: TransactionType.INCOME,
      amount: 2200,
      currency: CurrencyCode.UAH,
      d: 27,
    },
    {
      title: "Medicine",
      type: TransactionType.EXPENSE,
      amount: 780,
      currency: CurrencyCode.UAH,
      d: 28,
    },
  ];

  for (const tx of adminMonthTx) {
    await prisma.transaction.create({
      data: {
        title: tx.title,
        type: tx.type,
        amount: tx.amount,
        currencyCode: tx.currency,
        created_at: daysAgo(tx.d),
        userId: admin.id,
        ...(tx.lat && tx.lng
          ? { location: { create: { latitude: tx.lat, longitude: tx.lng } } }
          : {}),
      },
    });
  }

  // THIS YEAR (days 31–364, different months)
  const adminYearTx = [
    {
      title: "Quarterly bonus",
      type: TransactionType.INCOME,
      amount: 20000,
      currency: CurrencyCode.UAH,
      d: 35,
    },
    {
      title: "Egypt vacation",
      type: TransactionType.EXPENSE,
      amount: 35000,
      currency: CurrencyCode.UAH,
      d: 45,
      lat: 27.2579,
      lng: 33.8116,
    },
    {
      title: "New gadgets",
      type: TransactionType.EXPENSE,
      amount: 45000,
      currency: CurrencyCode.UAH,
      d: 60,
    },
    {
      title: "Investment return",
      type: TransactionType.INCOME,
      amount: 8000,
      currency: CurrencyCode.USD,
      d: 75,
    },
    {
      title: "Car insurance",
      type: TransactionType.EXPENSE,
      amount: 12000,
      currency: CurrencyCode.UAH,
      d: 90,
    },
    {
      title: "Salary Q1",
      type: TransactionType.INCOME,
      amount: 55000,
      currency: CurrencyCode.UAH,
      d: 100,
    },
    {
      title: "Car repair",
      type: TransactionType.EXPENSE,
      amount: 15000,
      currency: CurrencyCode.UAH,
      d: 120,
    },
    {
      title: "Dividends Q1",
      type: TransactionType.INCOME,
      amount: 5000,
      currency: CurrencyCode.USD,
      d: 130,
    },
    {
      title: "Training courses",
      type: TransactionType.EXPENSE,
      amount: 8000,
      currency: CurrencyCode.UAH,
      d: 150,
    },
    {
      title: "Large contract",
      type: TransactionType.INCOME,
      amount: 15000,
      currency: CurrencyCode.USD,
      d: 160,
    },
    {
      title: "Furniture",
      type: TransactionType.EXPENSE,
      amount: 28000,
      currency: CurrencyCode.UAH,
      d: 180,
    },
    {
      title: "Salary Q2",
      type: TransactionType.INCOME,
      amount: 58000,
      currency: CurrencyCode.UAH,
      d: 190,
    },
    {
      title: "Poland vacation",
      type: TransactionType.EXPENSE,
      amount: 20000,
      currency: CurrencyCode.UAH,
      d: 210,
      lat: 52.2297,
      lng: 21.0122,
    },
    {
      title: "Big freelance",
      type: TransactionType.INCOME,
      amount: 10000,
      currency: CurrencyCode.USD,
      d: 230,
    },
    {
      title: "Annual utilities",
      type: TransactionType.EXPENSE,
      amount: 4500,
      currency: CurrencyCode.UAH,
      d: 250,
    },
    {
      title: "Bonus Q3",
      type: TransactionType.INCOME,
      amount: 15000,
      currency: CurrencyCode.UAH,
      d: 270,
    },
    {
      title: "New camera",
      type: TransactionType.EXPENSE,
      amount: 22000,
      currency: CurrencyCode.UAH,
      d: 290,
    },
    {
      title: "Dividends Q3",
      type: TransactionType.INCOME,
      amount: 4000,
      currency: CurrencyCode.EUR,
      d: 310,
    },
    {
      title: "Apartment renovation",
      type: TransactionType.EXPENSE,
      amount: 60000,
      currency: CurrencyCode.UAH,
      d: 330,
    },
    {
      title: "Salary Q4",
      type: TransactionType.INCOME,
      amount: 60000,
      currency: CurrencyCode.UAH,
      d: 350,
    },
  ];

  for (const tx of adminYearTx) {
    await prisma.transaction.create({
      data: {
        title: tx.title,
        type: tx.type,
        amount: tx.amount,
        currencyCode: tx.currency,
        created_at: daysAgo(tx.d),
        userId: admin.id,
        ...(tx.lat && tx.lng
          ? { location: { create: { latitude: tx.lat, longitude: tx.lng } } }
          : {}),
      },
    });
  }

  // ── Donor transactions ────────────────────────────────────────────────────
  const donorTxData = [
    {
      title: "Salary",
      type: TransactionType.INCOME,
      amount: 40000,
      currency: CurrencyCode.UAH,
      d: 0,
    },
    {
      title: "Coffee",
      type: TransactionType.EXPENSE,
      amount: 110,
      currency: CurrencyCode.UAH,
      d: 0,
    },
    {
      title: "Freelance",
      type: TransactionType.INCOME,
      amount: 1200,
      currency: CurrencyCode.USD,
      d: 2,
    },
    {
      title: "Restaurant",
      type: TransactionType.EXPENSE,
      amount: 950,
      currency: CurrencyCode.UAH,
      d: 3,
      lat: 50.448,
      lng: 30.527,
    },
    {
      title: "Groceries",
      type: TransactionType.EXPENSE,
      amount: 1100,
      currency: CurrencyCode.UAH,
      d: 5,
    },
    {
      title: "Gym",
      type: TransactionType.EXPENSE,
      amount: 700,
      currency: CurrencyCode.UAH,
      d: 7,
    },
    {
      title: "Side job",
      type: TransactionType.INCOME,
      amount: 5000,
      currency: CurrencyCode.UAH,
      d: 10,
    },
    {
      title: "Internet",
      type: TransactionType.EXPENSE,
      amount: 350,
      currency: CurrencyCode.UAH,
      d: 12,
    },
    {
      title: "Utilities",
      type: TransactionType.EXPENSE,
      amount: 2000,
      currency: CurrencyCode.UAH,
      d: 15,
    },
    {
      title: "Bonus",
      type: TransactionType.INCOME,
      amount: 3000,
      currency: CurrencyCode.UAH,
      d: 20,
    },
    {
      title: "Clothing",
      type: TransactionType.EXPENSE,
      amount: 3200,
      currency: CurrencyCode.UAH,
      d: 22,
    },
    {
      title: "Consulting",
      type: TransactionType.INCOME,
      amount: 800,
      currency: CurrencyCode.EUR,
      d: 40,
    },
    {
      title: "Vacation",
      type: TransactionType.EXPENSE,
      amount: 15000,
      currency: CurrencyCode.UAH,
      d: 60,
      lat: 48.8566,
      lng: 2.3522,
    },
    {
      title: "Gadgets",
      type: TransactionType.EXPENSE,
      amount: 18000,
      currency: CurrencyCode.UAH,
      d: 100,
    },
    {
      title: "Salary Q2",
      type: TransactionType.INCOME,
      amount: 42000,
      currency: CurrencyCode.UAH,
      d: 180,
    },
  ];

  for (const tx of donorTxData) {
    await prisma.transaction.create({
      data: {
        title: tx.title,
        type: tx.type,
        amount: tx.amount,
        currencyCode: tx.currency,
        created_at: daysAgo(tx.d),
        userId: donor.id,
        ...(tx.lat && tx.lng
          ? { location: { create: { latitude: tx.lat, longitude: tx.lng } } }
          : {}),
      },
    });
  }

  // ── Regular user transactions ─────────────────────────────────────────────
  const regularTxData = [
    {
      title: "Salary",
      type: TransactionType.INCOME,
      amount: 22000,
      currency: CurrencyCode.UAH,
      d: 1,
    },
    {
      title: "Rent",
      type: TransactionType.EXPENSE,
      amount: 8000,
      currency: CurrencyCode.UAH,
      d: 2,
    },
    {
      title: "Groceries",
      type: TransactionType.EXPENSE,
      amount: 900,
      currency: CurrencyCode.UAH,
      d: 2,
    },
    {
      title: "Transport",
      type: TransactionType.EXPENSE,
      amount: 200,
      currency: CurrencyCode.UAH,
      d: 3,
    },
    {
      title: "Lunch",
      type: TransactionType.EXPENSE,
      amount: 180,
      currency: CurrencyCode.UAH,
      d: 4,
    },
    {
      title: "Side job",
      type: TransactionType.INCOME,
      amount: 3000,
      currency: CurrencyCode.UAH,
      d: 5,
    },
    {
      title: "Cinema",
      type: TransactionType.EXPENSE,
      amount: 250,
      currency: CurrencyCode.UAH,
      d: 7,
    },
    {
      title: "Utilities",
      type: TransactionType.EXPENSE,
      amount: 1800,
      currency: CurrencyCode.UAH,
      d: 10,
    },
    {
      title: "Salary",
      type: TransactionType.INCOME,
      amount: 22000,
      currency: CurrencyCode.UAH,
      d: 30,
    },
    {
      title: "Rent",
      type: TransactionType.EXPENSE,
      amount: 8000,
      currency: CurrencyCode.UAH,
      d: 31,
    },
    {
      title: "Salary",
      type: TransactionType.INCOME,
      amount: 22000,
      currency: CurrencyCode.UAH,
      d: 60,
    },
    {
      title: "Groceries",
      type: TransactionType.EXPENSE,
      amount: 750,
      currency: CurrencyCode.UAH,
      d: 62,
    },
  ];

  for (const tx of regularTxData) {
    await prisma.transaction.create({
      data: {
        title: tx.title,
        type: tx.type,
        amount: tx.amount,
        currencyCode: tx.currency,
        created_at: daysAgo(tx.d),
        userId: regularUser.id,
      },
    });
  }

  // Limited and telegram — minimal
  await prisma.transaction.createMany({
    data: [
      {
        title: "Salary",
        type: TransactionType.INCOME,
        amount: 18000,
        currencyCode: CurrencyCode.UAH,
        created_at: daysAgo(1),
        userId: limitedUser.id,
      },
      {
        title: "Groceries",
        type: TransactionType.EXPENSE,
        amount: 600,
        currencyCode: CurrencyCode.UAH,
        created_at: daysAgo(3),
        userId: limitedUser.id,
      },
      {
        title: "Freelance",
        type: TransactionType.INCOME,
        amount: 12000,
        currencyCode: CurrencyCode.UAH,
        created_at: daysAgo(2),
        userId: telegramUser.id,
      },
      {
        title: "Cinema",
        type: TransactionType.EXPENSE,
        amount: 200,
        currencyCode: CurrencyCode.UAH,
        created_at: daysAgo(5),
        userId: telegramUser.id,
      },
      {
        title: "Salary",
        type: TransactionType.INCOME,
        amount: 25000,
        currencyCode: CurrencyCode.UAH,
        created_at: daysAgo(1),
        userId: expiredDonor.id,
      },
      {
        title: "Rent",
        type: TransactionType.EXPENSE,
        amount: 9000,
        currencyCode: CurrencyCode.UAH,
        created_at: daysAgo(2),
        userId: expiredDonor.id,
      },
    ],
  });

  console.log("✅ Transactions created");

  // ── AI message history ────────────────────────────────────────────────────
  const aiConversations: Array<{
    userId: string;
    pairs: Array<{ prompt: string; result: string; daysBack: number }>;
  }> = [
    {
      userId: admin.id,
      pairs: [
        {
          prompt: "What are my main expenses this month?",
          result:
            "Your main expenses this month: rent 18000 UAH, gadgets 12000 UAH, repairs 8000 UAH. Total expenses are ~55000 UAH.",
          daysBack: 1,
        },
        {
          prompt: "Compare my income and expenses for the last quarter",
          result:
            "For the last quarter: income ~165000 UAH, expenses ~98000 UAH. Your balance is positive — you save about 40% of income.",
          daysBack: 3,
        },
        {
          prompt: "Where do I spend the most money?",
          result:
            "Largest spending categories: real estate (rent/repairs) — 35%, food and entertainment — 20%, gadgets — 15%.",
          daysBack: 7,
        },
      ],
    },
    {
      userId: donor.id,
      pairs: [
        {
          prompt: "Analyse my spending for this month",
          result:
            "This month your spending totals around 7000 UAH. Main categories: food 1100, rent 2000, gym 700, clothes 3200.",
          daysBack: 2,
        },
        {
          prompt: "How to increase my savings?",
          result:
            "Your current savings rate is ~20% of income. I recommend reducing spending on clothing and entertainment to 15% of the budget.",
          daysBack: 5,
        },
      ],
    },
    {
      userId: regularUser.id,
      pairs: [
        {
          prompt: "How much did I earn this month?",
          result: "This month your income was 25000 UAH (salary + side job).",
          daysBack: 1,
        },
      ],
    },
  ];

  for (const convo of aiConversations) {
    for (const pair of convo.pairs) {
      const base = daysAgo(pair.daysBack);
      await prisma.message.create({
        data: {
          userId: convo.userId,
          role: "user",
          content: pair.prompt,
          created_at: base,
        },
      });
      await prisma.message.create({
        data: {
          userId: convo.userId,
          role: "assistant",
          content: pair.result,
          created_at: new Date(base.getTime() + 3000),
        },
      });
    }
  }

  console.log("✅ AI message history created");

  // ── Donation payments ─────────────────────────────────────────────────────
  const donationData = [
    {
      userId: admin.id,
      sessionId: "cs_seed_admin_001",
      intentId: "pi_seed_admin_001",
      amount: 500,
      d: 60,
    },
    {
      userId: admin.id,
      sessionId: "cs_seed_admin_002",
      intentId: "pi_seed_admin_002",
      amount: 300,
      d: 30,
    },
    {
      userId: donor.id,
      sessionId: "cs_seed_donor_001",
      intentId: "pi_seed_donor_001",
      amount: 300,
      d: 30,
    },
    {
      userId: donor.id,
      sessionId: "cs_seed_donor_002",
      intentId: "pi_seed_donor_002",
      amount: 500,
      d: 15,
    },
    {
      userId: expiredDonor.id,
      sessionId: "cs_seed_expired_001",
      intentId: "pi_seed_expired_001",
      amount: 300,
      d: 120,
    },
    {
      userId: regularUser.id,
      sessionId: "cs_seed_regular_001",
      intentId: null,
      amount: 300,
      d: 5,
      status: "PENDING" as const,
    },
  ];

  for (const d of donationData) {
    await prisma.donationPayment.create({
      data: {
        userId: d.userId,
        stripeCheckoutSessionId: d.sessionId,
        stripePaymentIntentId: d.intentId ?? null,
        amount: d.amount,
        currency: "usd",
        status: (d.status ?? "SUCCEEDED") as "SUCCEEDED" | "PENDING",
        completedAt: d.status === "PENDING" ? null : daysAgo(d.d),
        createdAt: daysAgo(d.d),
      },
    });
  }

  console.log("✅ Donation payments created");

  // ── Error logs ────────────────────────────────────────────────────────────
  const errorLogsData = [
    {
      userId: unverifiedUser.id,
      title: "Verification email not received",
      message:
        "User reporting missing confirmation email after multiple attempts",
      source: "api:/auth/resend-verification",
      status: "OPEN" as const,
      d: 1,
    },
    {
      userId: regularUser.id,
      title: "Dashboard crash on load",
      message: "Cannot read properties of undefined (reading 'data')",
      stack:
        "TypeError: Cannot read properties of undefined\n  at Dashboard.tsx:42:15\n  at renderWithHooks\n  at mountIndeterminateComponent",
      source: "route:dashboard:error-boundary",
      status: "OPEN" as const,
      d: 0,
    },
    {
      userId: donor.id,
      title: "Analytics AI timeout",
      message: "Request timeout after 30000ms waiting for Groq API",
      stack: "Error: timeout\n  at ai/service.ts:88",
      source: "api:/ai",
      status: "RESOLVED" as const,
      resolvedByAdminId: admin.id,
      resolutionNote:
        "Groq API was temporarily unavailable. Fixed by switching to backup key.",
      d: 2,
    },
    {
      userId: limitedUser.id,
      title: "Transaction form validation error",
      message: "Zod validation failed: amount must be positive",
      source: "route:transactions:error-boundary",
      status: "OPEN" as const,
      d: 1,
    },
    {
      userId: expiredDonor.id,
      title: "Monobank token rejected",
      message: "Invalid Monobank token — 401 Unauthorized",
      stack: "AppError: Invalid Monobank token\n  at monobank.controller.ts:55",
      source: "api:/transactions/monobank/fetch",
      status: "RESOLVED" as const,
      resolvedByAdminId: admin.id,
      resolutionNote:
        "User provided expired token. Advised to regenerate at api.monobank.ua.",
      d: 5,
    },
    {
      userId: regularUser.id,
      title: "Unhandled promise rejection in OAuthBridge",
      message: "Cannot read properties of null (reading 'googleIdToken')",
      stack: "TypeError at OAuthBridge.tsx:34",
      source: "window.unhandledrejection",
      status: "OPEN" as const,
      d: 3,
    },
    {
      userId: telegramUser.id,
      title: "Chart.js rendering error",
      message: "Canvas element not found when rendering income chart",
      source: "route:dashboard:error-boundary",
      status: "OPEN" as const,
      d: 4,
    },
    {
      userId: donor.id,
      title: "Stripe webhook duplicate event",
      message: "Duplicate stripeEventId detected: evt_test_123",
      source: "api:/donations/webhook",
      status: "RESOLVED" as const,
      resolvedByAdminId: admin.id,
      resolutionNote: "Expected behavior — idempotency guard works correctly.",
      d: 10,
    },
    {
      userId: regularUser.id,
      title: "Leaflet map crash on mobile",
      message: "Map container not found — likely SSR issue",
      source: "route:transactions:error-boundary",
      status: "OPEN" as const,
      d: 6,
    },
  ];

  for (const log of errorLogsData) {
    await prisma.errorLog.create({
      data: {
        userId: log.userId,
        title: log.title,
        message: log.message,
        stack: log.stack ?? null,
        source: log.source,
        status: log.status,
        resolvedByAdminId: log.resolvedByAdminId ?? null,
        resolutionNote: log.resolutionNote ?? null,
        resolvedAt: log.resolvedByAdminId ? daysAgo(log.d - 1) : null,
        createdAt: daysAgo(log.d),
      },
    });
  }

  console.log("✅ Error logs created (9)");

  // ── Summary ───────────────────────────────────────────────────────────────
  const f = (email: string, role: string, status: string, info: string) =>
    `  ${email.padEnd(25)} | ${role.padEnd(6)} | ${status.padEnd(12)} | ${info}`;

  console.log(`
📋 Seed summary:
──────────────────────────────────────────────────────────────────────────────────────
${f("admin@fintrack.dev", "ADMIN", "verified", "donor — 50+ txs across all ranges")}
${f("donor@fintrack.dev", "USER", "verified", "donor — 15 txs, 2 AI convos")}
${f("user@fintrack.dev", "USER", "verified", "7/10 AI — 12 txs")}
${f("limited@fintrack.dev", "USER", "verified", "10/10 AI (limit hit) — 2 txs")}
${f("unverified@fintrack.dev", "USER", "unverified", "0 txs")}
${f("expired@fintrack.dev", "USER", "verified", "expired donor — 2 txs")}
${f("Telegram (9876543210)", "USER", "verified", "2 txs")}

  🔑 Password for all email accounts => 11111111

  Transactions : 86 total
  AI messages  : 12 (6 pairs across 3 users)
  Donations    : 6 payments (5 SUCCEEDED, 1 PENDING)
  Error logs   : 9 (6 OPEN, 3 RESOLVED)
──────────────────────────────────────────────────────────────────────────────────────
✅ Seeding finished successfully!
  `);
}

if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      await runSeed();
    } catch (err) {
      console.error("❌ Error while seeding database:", err);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}
