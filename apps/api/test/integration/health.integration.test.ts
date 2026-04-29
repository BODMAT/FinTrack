import request from "supertest";

import type { app as AppType } from "../../src/app.js";

let app: typeof AppType;

beforeAll(async () => {
  ({ app } = await import("../../src/app.js"));
});

describe("Health Integration", () => {
  it("returns 200 for /api/health", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("returns 404 for removed /api/users route", async () => {
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Endpoint not found");
  });
});
