import request from "supertest";
import { app } from "../../src/app.js";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

type Method = "get" | "post" | "patch" | "put" | "delete";

const PROTECTED_ENDPOINTS: Array<{ method: Method; path: string }> = [
  // users
  { method: "get", path: "/api/users/me" },
  { method: "patch", path: "/api/users/me" },
  { method: "delete", path: "/api/users/me" },
  { method: "delete", path: `/api/users/me/auth-methods/${UUID}` },

  // transactions
  { method: "get", path: "/api/transactions" },
  { method: "post", path: "/api/transactions" },
  { method: "get", path: `/api/transactions/${UUID}` },
  { method: "patch", path: `/api/transactions/${UUID}` },
  { method: "delete", path: `/api/transactions/${UUID}` },
  { method: "post", path: "/api/transactions/monobank/accounts" },
  { method: "post", path: "/api/transactions/monobank/fetch" },
  { method: "post", path: "/api/transactions/monobank/import" },
  { method: "delete", path: "/api/transactions/monobank" },

  // summary
  { method: "get", path: "/api/summary" },

  // ai
  { method: "get", path: "/api/ai/history" },
  { method: "get", path: "/api/ai/access" },
  { method: "post", path: "/api/ai" },

  // user api keys
  { method: "get", path: "/api/user-api-keys" },
  { method: "put", path: "/api/user-api-keys" },
  { method: "delete", path: "/api/user-api-keys/groq" },
  { method: "patch", path: "/api/user-api-keys/groq/toggle" },

  // donations
  { method: "post", path: "/api/donations/checkout-session" },

  // admin
  { method: "get", path: "/api/admin/stats" },
  { method: "get", path: "/api/admin/users" },
  { method: "get", path: "/api/admin/error-logs" },
  { method: "post", path: `/api/admin/sessions/revoke-user/${UUID}` },
  { method: "post", path: "/api/admin/sessions/revoke-all" },
  { method: "patch", path: `/api/admin/users/${UUID}/role` },
  { method: "patch", path: `/api/admin/error-logs/${UUID}/resolve` },
  { method: "post", path: "/api/admin/error-logs/report" },
];

describe("Auth Guards — all protected endpoints return 401 without token", () => {
  it.each(PROTECTED_ENDPOINTS)(
    "$method $path → 401",
    async ({ method, path }) => {
      const agent = request(app) as Record<
        Method,
        (url: string) => request.Test
      >;
      const res = await agent[method](path);
      expect(res.status).toBe(401);
    },
  );
});
