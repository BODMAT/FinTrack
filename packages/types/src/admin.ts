import { z } from "zod";

export const ErrorLogStatusSchema = z.enum(["OPEN", "RESOLVED"]);

export const UpdateUserRoleBodySchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const AdminListErrorLogsQuerySchema = z.object({
  status: ErrorLogStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ReportErrorLogBodySchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  stack: z.string().max(20000).optional(),
  source: z.string().max(200).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const ResolveErrorLogBodySchema = z.object({
  resolved: z.boolean(),
  resolutionNote: z.string().max(5000).optional(),
});

export const AdminUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.enum(["USER", "ADMIN"]),
  isVerified: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  authMethods: z.array(
    z.object({
      type: z.enum(["EMAIL", "TELEGRAM", "GOOGLE"]),
      email: z.string().email().nullable().optional(),
      telegram_id: z.string().nullable().optional(),
      google_sub: z.string().nullable().optional(),
    }),
  ),
});

export const AdminUsersSchema = AdminUserSchema.array();

export const AdminStatsSchema = z.object({
  users: z.object({
    total: z.number(),
    admins: z.number(),
    verified: z.number(),
    newLast7Days: z.number(),
  }),
  sessions: z.object({
    active: z.number(),
  }),
  errors: z.object({
    open: z.number(),
  }),
  generatedAt: z.coerce.date(),
});

export const AdminRevokeSessionsSchema = z.object({
  revokedCount: z.number(),
});

export const AdminErrorLogSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  stack: z.string().nullable(),
  source: z.string().nullable(),
  userAgent: z.string().nullable(),
  status: ErrorLogStatusSchema,
  resolutionNote: z.string().nullable(),
  context: z.unknown().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    role: z.enum(["USER", "ADMIN"]),
  }),
  resolvedByAdmin: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
});

export const AdminErrorLogsSchema = AdminErrorLogSchema.array();

export const AdminResolveErrorLogSchema = z.object({
  id: z.string().uuid(),
  status: ErrorLogStatusSchema,
  resolvedAt: z.coerce.date().nullable(),
  resolutionNote: z.string().nullable(),
  resolvedByAdminId: z.string().uuid().nullable(),
  updatedAt: z.coerce.date(),
});

export type UpdateUserRoleBody = z.infer<typeof UpdateUserRoleBodySchema>;
export type AdminListErrorLogsQuery = z.infer<
  typeof AdminListErrorLogsQuerySchema
>;
export type ReportErrorLogBody = z.infer<typeof ReportErrorLogBodySchema>;
export type ResolveErrorLogBody = z.infer<typeof ResolveErrorLogBodySchema>;
export type ErrorLogStatus = z.infer<typeof ErrorLogStatusSchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
export type AdminStats = z.infer<typeof AdminStatsSchema>;
export type AdminErrorLog = z.infer<typeof AdminErrorLogSchema>;
