import z from "zod";

export const DonationCheckoutSessionSchema = z.object({
  checkoutUrl: z.string().url(),
  checkoutSessionId: z.string(),
});

export const DonationLeaderboardItemSchema = z.object({
  userId: z.string(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  totalAmountMinor: z.number().int().nonnegative(),
  currency: z.string(),
});

export const DonationLeaderboardSchema = z.object({
  items: z.array(DonationLeaderboardItemSchema),
});

export type DonationCheckoutSession = z.infer<
  typeof DonationCheckoutSessionSchema
>;
export type DonationLeaderboardItem = z.infer<
  typeof DonationLeaderboardItemSchema
>;
export type DonationLeaderboard = z.infer<typeof DonationLeaderboardSchema>;
