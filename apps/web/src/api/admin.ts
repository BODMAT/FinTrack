import { handleRequest } from "@/utils/api";
import api from "./api";
import {
  AdminErrorLogsSchema,
  AdminResolveErrorLogSchema,
  AdminRevokeSessionsSchema,
  AdminStatsSchema,
  AdminUsersSchema,
  type AdminStats,
  type AdminUser,
  type ErrorLogStatus,
} from "@fintrack/types";

export async function getAdminUsers(): Promise<AdminUser[]> {
  return handleRequest(api.get("/admin/users"), AdminUsersSchema);
}

export async function updateAdminUserRole(
  userId: string,
  role: "USER" | "ADMIN",
) {
  return handleRequest(api.patch(`/admin/users/${userId}/role`, { role }));
}

export async function revokeSessionsForUser(userId: string): Promise<{
  revokedCount: number;
}> {
  return handleRequest(
    api.post(`/admin/sessions/revoke-user/${userId}`),
    AdminRevokeSessionsSchema,
  );
}

export async function revokeSessionsForAll(): Promise<{
  revokedCount: number;
}> {
  return handleRequest(
    api.post("/admin/sessions/revoke-all"),
    AdminRevokeSessionsSchema,
  );
}

export async function getAdminStats(): Promise<AdminStats> {
  return handleRequest(api.get("/admin/stats"), AdminStatsSchema);
}

export async function getAdminErrorLogs(params?: {
  status?: ErrorLogStatus;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));

  const qs = search.toString();
  const path = qs ? `/admin/error-logs?${qs}` : "/admin/error-logs";

  return handleRequest(api.get(path), AdminErrorLogsSchema);
}

export async function resolveAdminErrorLog(
  errorLogId: string,
  payload: { resolved: boolean; resolutionNote?: string },
) {
  return handleRequest(
    api.patch(`/admin/error-logs/${errorLogId}/resolve`, payload),
    AdminResolveErrorLogSchema,
  );
}

export async function reportClientError(payload: {
  title: string;
  message: string;
  stack?: string;
  source?: string;
  context?: Record<string, unknown>;
}) {
  return handleRequest(api.post("/admin/error-logs/report", payload));
}
