import { jest } from "@jest/globals";

jest.unstable_mockModule("bcrypt", () => ({
  default: { hash: jest.fn().mockResolvedValue("hashed") },
  hash: jest.fn().mockResolvedValue("hashed"),
}));

const mockUser = { id: "seed-user-id" };
const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
const mockDeleteMany = jest.fn();
const mockCreate = jest.fn().mockResolvedValue(mockUser);
const mockCreateMany = jest.fn().mockResolvedValue({ count: 0 });
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule("../../../src/prisma/client.js", () => ({
  prisma: {
    $connect: mockConnect,
    $disconnect: mockDisconnect,
    authMethod: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
    },
    user: {
      deleteMany: mockDeleteMany,
      create: mockCreate,
    },
    transaction: {
      create: mockCreate,
      createMany: mockCreateMany,
    },
    message: { create: mockCreate },
    donationPayment: { create: mockCreate },
    errorLog: { create: mockCreate },
  },
}));

jest.unstable_mockModule("../../../src/utils/crypto.js", () => ({
  encryptApiKey: (key: string) => `encrypted:${key}`,
}));

let runSeed: () => Promise<void>;

beforeAll(async () => {
  ({ runSeed } = await import("../../../src/prisma/seed.js"));
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockFindFirst.mockResolvedValue(null);
  mockDeleteMany.mockResolvedValue({ count: 0 });
  mockCreate.mockResolvedValue(mockUser);
  mockCreateMany.mockResolvedValue({ count: 0 });
});

describe("seed idempotency", () => {
  it("runs without error on first call", async () => {
    await expect(runSeed()).resolves.not.toThrow();
  });

  it("runs without error on second call (idempotent)", async () => {
    await runSeed();
    await expect(runSeed()).resolves.not.toThrow();
  });

  it("deletes stale users when previous seed data exists", async () => {
    mockFindMany.mockResolvedValue([
      { userId: "old-id-1" },
      { userId: "old-id-2" },
    ]);
    mockFindFirst.mockResolvedValue({ userId: "old-id-3" });

    await runSeed();

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["old-id-1", "old-id-2", "old-id-3"] } },
    });
  });

  it("skips deleteMany when no stale users exist", async () => {
    mockFindMany.mockResolvedValue([]);
    mockFindFirst.mockResolvedValue(null);

    await runSeed();

    expect(mockDeleteMany).not.toHaveBeenCalled();
  });

  it("does not call $disconnect (caller's responsibility)", async () => {
    await runSeed();
    expect(mockDisconnect).not.toHaveBeenCalled();
  });
});
