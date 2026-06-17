// Mock ioredis for tests — no real Redis connection needed.
// rate-limit-redis v5 uses SCRIPT LOAD → EVALSHA (Lua).
// This mock returns correct types for each command so the store
// initialises and counts properly without a real Redis instance.

const hitCounts: Record<string, number> = {};

const call = (command: string, ...args: string[]): Promise<unknown> => {
  if (command === "SCRIPT") {
    // SCRIPT LOAD → string SHA; SCRIPT EXISTS → [1]
    if (args[0] === "EXISTS") return Promise.resolve([1]);
    return Promise.resolve("fakescriptsha1234567890abcdef1234");
  }

  if (command === "EVALSHA") {
    // increment call: EVALSHA sha "1" key resetOnChange windowMs  (args.length >= 4)
    // get call:       EVALSHA sha "1" key                         (args.length === 3)
    const key = args[2] ?? "";
    if (args.length >= 4) {
      hitCounts[key] = (hitCounts[key] ?? 0) + 1;
      return Promise.resolve([hitCounts[key], 900_000]);
    }
    return Promise.resolve([hitCounts[key] ?? 0, 900_000]);
  }

  // bot tokenStore commands (GET / SET / DEL / EXISTS)
  if (command === "GET") return Promise.resolve(null);
  if (command === "SET") return Promise.resolve("OK");
  if (command === "DEL") return Promise.resolve(1);
  if (command === "EXISTS") return Promise.resolve(0);

  return Promise.resolve(null);
};

const redisMock = {
  call,
  get: () => Promise.resolve(null),
  set: () => Promise.resolve("OK"),
  del: () => Promise.resolve(1),
  exists: () => Promise.resolve(0),
  on: () => {},
  quit: () => Promise.resolve("OK"),
};

export const Redis = function () {
  return redisMock;
};

export default Redis;
