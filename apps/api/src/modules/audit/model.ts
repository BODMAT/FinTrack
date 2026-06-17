import { Schema, model } from "mongoose";

export interface AuditEvent {
  type: string;
  userId?: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

const auditEventSchema = new Schema<AuditEvent>(
  {
    type: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AuditEventModel = model<AuditEvent>(
  "AuditEvent",
  auditEventSchema,
);
