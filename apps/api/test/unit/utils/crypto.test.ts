import { encryptApiKey, decryptApiKey } from "../../../src/utils/crypto.js";

const PLAIN = "sk-proj-my-very-secret-api-key-1234";

describe("crypto utils – encryptApiKey", () => {
  it("returns three colon-separated parts", () => {
    const parts = encryptApiKey(PLAIN).split(":");
    expect(parts).toHaveLength(3);
    for (const p of parts) expect(p.length).toBeGreaterThan(0);
  });

  it("each call produces unique ciphertext (random IV)", () => {
    expect(encryptApiKey(PLAIN)).not.toBe(encryptApiKey(PLAIN));
  });

  it("does not leak plaintext into output", () => {
    expect(encryptApiKey(PLAIN)).not.toContain(PLAIN);
  });

  it("all three parts are valid base64", () => {
    const parts = encryptApiKey(PLAIN).split(":");
    for (const p of parts) {
      expect(() => Buffer.from(p, "base64")).not.toThrow();
    }
  });
});

describe("crypto utils – decryptApiKey", () => {
  it("round-trip recovers original plaintext", () => {
    expect(decryptApiKey(encryptApiKey(PLAIN))).toBe(PLAIN);
  });

  it("round-trip with empty string", () => {
    expect(decryptApiKey(encryptApiKey(""))).toBe("");
  });

  it("round-trip with unicode / emoji", () => {
    const unicode = "секретний-ключ-🔑";
    expect(decryptApiKey(encryptApiKey(unicode))).toBe(unicode);
  });

  it("round-trip with very long string", () => {
    const long = "a".repeat(4096);
    expect(decryptApiKey(encryptApiKey(long))).toBe(long);
  });

  it("throws for input with wrong number of parts (2 parts)", () => {
    expect(() => decryptApiKey("only:two")).toThrow(
      "Invalid encrypted key format",
    );
  });

  it("throws for input with wrong number of parts (1 part)", () => {
    expect(() => decryptApiKey("onepart")).toThrow(
      "Invalid encrypted key format",
    );
  });

  it("throws for input with wrong number of parts (4 parts)", () => {
    expect(() => decryptApiKey("a:b:c:d")).toThrow(
      "Invalid encrypted key format",
    );
  });

  it("throws for tampered auth tag (GCM integrity violation)", () => {
    const encrypted = encryptApiKey(PLAIN);
    const [iv, , enc] = encrypted.split(":") as [string, string, string];
    const badTag = Buffer.alloc(16, 0xff).toString("base64");
    expect(() => decryptApiKey(`${iv}:${badTag}:${enc}`)).toThrow();
  });
});
