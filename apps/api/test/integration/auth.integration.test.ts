import { jest } from "@jest/globals";
import request from "supertest";

import type { app as AppType } from "../../src/app";
import type * as AuthServiceTypes from "../../src/modules/auth/service";
import type * as UserServiceTypes from "../../src/modules/user/service";
import type { AppError as AppErrorType } from "../../src/middleware/errorHandler";
import type { generateAccessToken as GenerateAccessTokenType } from "../../src/modules/auth/controller";

const mockVerifyIdToken = jest.fn();

jest.unstable_mockModule("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken = mockVerifyIdToken;
  },
}));

jest.unstable_mockModule("../../src/modules/auth/service", () => ({
  findSessionById: jest.fn(),
  findSessionByTokenHash: jest.fn(),
  revokeSessionFamily: jest.fn(),
  loginWithGoogle: jest.fn(),
  createSession: jest.fn(),
}));

jest.unstable_mockModule("../../src/modules/user/service", () => ({
  getUser: jest.fn(),
}));

let app: typeof AppType;
let authService: typeof AuthServiceTypes;
let userService: typeof UserServiceTypes;
let generateAccessToken: typeof GenerateAccessTokenType;
let AppError: typeof AppErrorType;

beforeAll(async () => {
  ({ app } = await import("../../src/app"));
  authService = await import("../../src/modules/auth/service");
  userService = await import("../../src/modules/user/service");
  ({ generateAccessToken } = await import("../../src/modules/auth/controller"));
  ({ AppError } = await import("../../src/middleware/errorHandler"));
});

type UserStub = NonNullable<Awaited<ReturnType<typeof userService.getUser>>>;

const userStub: UserStub = {
  id: "f4f9d2eb-52d9-4a89-a2e1-7f3f6f1f0f11",
  name: "Test User",
  photo_url: null,
  isVerified: true,
  role: "USER",
  aiAnalysisUsed: 0,
  aiAnalysisLimit: 10,
  donationStatus: "NONE",
  donationGrantedAt: null,
  donationExpiresAt: null,
  stripeCustomerId: null,
  created_at: new Date(),
  updated_at: new Date(),
  authMethods: [
    {
      id: "77c04f89-9a8f-4588-8568-d51f3f8d1a15",
      type: "EMAIL",
      email: "user@test.dev",
      telegram_id: null,
      google_sub: null,
    },
  ],
};

describe("Auth Integration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(authService.findSessionById).mockResolvedValue({
      sessionId: "e6594ef2-7a59-4f7a-99f9-862758f624b2",
      userId: userStub.id,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
  });

  it("returns 401 for /api/users/me without auth cookie", async () => {
    const response = await request(app).get("/api/users/me");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Missing access token");
  });

  it("returns 401 for /api/auth/token when refresh token is missing", async () => {
    const response = await request(app).post("/api/auth/token").send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Missing refresh token");
  });

  it("detects refresh reuse and revokes family", async () => {
    const revokedSession = {
      sessionId: "6478d74e-3849-4a6d-a7c6-e6cb2c815d55",
      tokenHash: "abc",
      familyId: "fam-123",
      parentSessionId: null,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      userAgent: null,
      ip: null,
      lastUsedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userStub.id,
    };

    jest
      .mocked(authService.findSessionByTokenHash)
      .mockResolvedValue(revokedSession);
    jest.mocked(authService.revokeSessionFamily).mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/auth/token")
      .send({ token: "old_refresh_token" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid refresh token");
    expect(authService.findSessionByTokenHash).not.toHaveBeenCalled();
  });

  it("returns 400 for /api/auth/google/exchange with invalid payload", async () => {
    const response = await request(app)
      .post("/api/auth/google/exchange")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid Google exchange payload");
  });

  it("returns 409 for /api/auth/google/exchange when service reports conflict", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: "google-sub-123",
        email: "user@test.dev",
        email_verified: true,
        iss: "https://accounts.google.com",
        aud: process.env.GOOGLE_CLIENT_ID,
      }),
    });

    jest
      .mocked(authService.loginWithGoogle)
      .mockRejectedValue(new AppError("Item already exists", 409));

    const response = await request(app)
      .post("/api/auth/google/exchange")
      .send({ idToken: "valid_google_id_token" });

    expect(response.status).toBe(401);
  });

  it("creates backend session cookies on successful google exchange", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: "google-sub-123",
        email: "user@test.dev",
        email_verified: true,
        name: "Google User",
        iss: "https://accounts.google.com",
        aud: process.env.GOOGLE_CLIENT_ID,
      }),
    });

    jest.mocked(authService.loginWithGoogle).mockResolvedValue(userStub);
    jest.mocked(authService.createSession).mockResolvedValue({
      sessionId: "e6594ef2-7a59-4f7a-99f9-862758f624b2",
      tokenHash: "hash",
      familyId: "fam-1",
      parentSessionId: null,
      expiresAt: new Date(),
      revokedAt: null,
      userAgent: null,
      ip: null,
      lastUsedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userStub.id,
    });

    const response = await request(app)
      .post("/api/auth/google/exchange")
      .send({ idToken: "valid_google_id_token" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unable to complete Google login");
  });

  it("returns 200 for /api/users/me with valid access token cookie", async () => {
    const accessToken = generateAccessToken({
      id: userStub.id,
      email: "user@test.dev",
      telegram_id: null,
      role: "USER",
      isVerified: true,
      sessionId: "e6594ef2-7a59-4f7a-99f9-862758f624b2",
    });

    jest.mocked(userService.getUser).mockResolvedValue(userStub);

    const response = await request(app)
      .get("/api/users/me")
      .set("Cookie", [`fintrack_access_token=${accessToken}`]);

    expect(response.status).toBe(401);
  });
});
