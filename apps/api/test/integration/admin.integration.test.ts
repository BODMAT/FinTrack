import request from "supertest";
import { app } from "../../src/app.js";
import { generateAccessToken } from "../../src/modules/auth/controller.js";
import * as adminService from "../../src/modules/admin/service.js";
import * as authService from "../../src/modules/auth/service.js";

describe("Admin Integration", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(authService, "findSessionById").mockResolvedValue({
      sessionId: "e5af2f58-5f09-4c64-8e13-f5b9323248d0",
      userId: "1772f0ba-450d-4b81-bb7c-df6f0a7483c3",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
  });

  it("returns 401 for admin stats without auth cookie", async () => {
    const response = await request(app).get("/api/admin/stats");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Missing access token");
  });

  it("returns 403 for admin stats when role is USER", async () => {
    const accessToken = generateAccessToken({
      id: "6e562f73-df6c-4ef0-b830-cdc5e4cd43ef",
      email: "user@test.dev",
      telegram_id: null,
      role: "USER",
      isVerified: true,
      sessionId: "86f97690-d689-4fd8-9bf9-5fbf9f4cce59",
    });
    jest.spyOn(authService, "findSessionById").mockResolvedValue({
      sessionId: "86f97690-d689-4fd8-9bf9-5fbf9f4cce59",
      userId: "6e562f73-df6c-4ef0-b830-cdc5e4cd43ef",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const response = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", [`fintrack_access_token=${accessToken}`]);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Forbidden");
  });

  it("returns 200 for admin stats when role is ADMIN", async () => {
    const accessToken = generateAccessToken({
      id: "1772f0ba-450d-4b81-bb7c-df6f0a7483c3",
      email: "admin@test.dev",
      telegram_id: null,
      role: "ADMIN",
      isVerified: true,
      sessionId: "e5af2f58-5f09-4c64-8e13-f5b9323248d0",
    });

    jest.spyOn(adminService, "getAdminStats").mockResolvedValue({
      users: { total: 10, admins: 1, verified: 8, newLast7Days: 3 },
      sessions: { active: 5 },
      errors: { open: 2 },
      generatedAt: new Date("2026-04-08T15:00:00.000Z"),
    });

    const response = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", [`fintrack_access_token=${accessToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.users.total).toBe(10);
  });

  it("creates error log from authenticated user", async () => {
    const userId = "5b13fd44-9f31-4f4d-becd-0a7c95673b9b";
    const accessToken = generateAccessToken({
      id: userId,
      email: "user@test.dev",
      telegram_id: null,
      role: "USER",
      isVerified: true,
      sessionId: "f2945050-c0f7-4a4b-a117-775370a2fed0",
    });
    jest.spyOn(authService, "findSessionById").mockResolvedValue({
      sessionId: "f2945050-c0f7-4a4b-a117-775370a2fed0",
      userId,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const createSpy = jest
      .spyOn(adminService, "reportErrorLog")
      .mockResolvedValue({
        id: "87eecaf5-00d5-46b4-9f55-51f0402bc201",
        title: "Dashboard crash",
        status: "OPEN",
        createdAt: new Date("2026-04-08T15:00:00.000Z"),
      } as Awaited<ReturnType<typeof adminService.reportErrorLog>>);

    const response = await request(app)
      .post("/api/admin/error-logs/report")
      .set("Cookie", [`fintrack_access_token=${accessToken}`])
      .send({
        title: "Dashboard crash",
        message: "Cannot render dashboard",
        source: "dashboard",
      });

    expect(response.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        title: "Dashboard crash",
        message: "Cannot render dashboard",
      }),
    );
  });

  it("revokes sessions for specific user", async () => {
    const adminId = "1772f0ba-450d-4b81-bb7c-df6f0a7483c3";
    const targetUserId = "6e562f73-df6c-4ef0-b830-cdc5e4cd43ef";
    const accessToken = generateAccessToken({
      id: adminId,
      email: "admin@test.dev",
      telegram_id: null,
      role: "ADMIN",
      isVerified: true,
      sessionId: "2f06ee39-6fb3-483c-9a7c-20ef60eafbce",
    });

    jest.spyOn(authService, "findSessionById").mockResolvedValue({
      sessionId: "2f06ee39-6fb3-483c-9a7c-20ef60eafbce",
      userId: adminId,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const revokeSpy = jest
      .spyOn(adminService, "revokeUserSessions")
      .mockResolvedValue({ revokedCount: 3 });

    const response = await request(app)
      .post(`/api/admin/sessions/revoke-user/${targetUserId}`)
      .set("Cookie", [`fintrack_access_token=${accessToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.revokedCount).toBe(3);
    expect(revokeSpy).toHaveBeenCalledWith(targetUserId);
  });

  it("revokes sessions for all users", async () => {
    const adminId = "1772f0ba-450d-4b81-bb7c-df6f0a7483c3";
    const accessToken = generateAccessToken({
      id: adminId,
      email: "admin@test.dev",
      telegram_id: null,
      role: "ADMIN",
      isVerified: true,
      sessionId: "6fba9450-ee14-4e5f-89f0-112d5a9883d0",
    });

    jest.spyOn(authService, "findSessionById").mockResolvedValue({
      sessionId: "6fba9450-ee14-4e5f-89f0-112d5a9883d0",
      userId: adminId,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const revokeSpy = jest
      .spyOn(adminService, "revokeAllSessions")
      .mockResolvedValue({ revokedCount: 7 });

    const response = await request(app)
      .post("/api/admin/sessions/revoke-all")
      .set("Cookie", [`fintrack_access_token=${accessToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.revokedCount).toBe(7);
    expect(revokeSpy).toHaveBeenCalled();
  });
});
