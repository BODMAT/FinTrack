import z from "zod";

export const CreateAuthMethodSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("EMAIL"),
    email: z.string().email().max(200),
    password: z.string().min(8),
  }),
  z.object({
    type: z.literal("TELEGRAM"),
    telegram_id: z.string().min(1),
  }),
]);

export const UpdateAuthMethodSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("EMAIL"),
    email: z.string().email().max(200).optional(),
    password: z.string().min(8).optional(),
  }),
  z.object({
    type: z.literal("TELEGRAM"),
    telegram_id: z.string().min(1),
  }),
]);

export const AuthMethodResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["EMAIL", "TELEGRAM"]),
  email: z.string().email().nullable(),
  telegram_id: z.string().nullable(),
});

export const СreateUserSchema = z.object({
  name: z.string().min(1).max(200),
  photo_url: z.string().url().nullish().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  authMethods: z
    .array(CreateAuthMethodSchema)
    .min(1)
    .max(2)
    .refine(
      (methods) => {
        const types = methods.map((m) => m.type);
        return (
          types.filter((t) => t === "EMAIL").length <= 1 &&
          types.filter((t) => t === "TELEGRAM").length <= 1
        );
      },
      {
        message:
          "You can add a maximum of one EMAIL and one TELEGRAM authentication method",
      },
    ),
});

export const UpdateUserSchema = СreateUserSchema.partial();

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  photo_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  authMethods: z.array(AuthMethodResponseSchema),
});

//==============================================================================

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type CreateUserBody = z.infer<typeof СreateUserSchema>;
