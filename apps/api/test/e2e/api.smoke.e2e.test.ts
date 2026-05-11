import request from "supertest";
import { app } from "../../src/app.js";

describe("API E2E Smoke", () => {
  it("GET /api/health returns 200", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("GET /api/users/me without auth returns 401", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing access token");
  });

  it("GET /api/summary without auth returns 401", async () => {
    const res = await request(app).get("/api/summary");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing access token");
  });

  it("unknown endpoint returns 404", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Endpoint not found");
  });
});
