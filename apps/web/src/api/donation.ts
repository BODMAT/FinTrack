import api from "./api";
import { handleRequest } from "@/utils/api";
import {
  DonationCheckoutSessionSchema,
  type DonationCheckoutSession,
  DonationLeaderboardSchema,
  type DonationLeaderboard,
} from "@/types/donation";

export async function createDonationCheckoutSession(
  idempotencyKey: string,
): Promise<DonationCheckoutSession> {
  return handleRequest<DonationCheckoutSession>(
    api.post(
      "/donations/checkout-session",
      {},
      {
        headers: {
          "x-idempotency-key": idempotencyKey,
        },
      },
    ),
    DonationCheckoutSessionSchema,
  );
}

export async function getDonationLeaderboard(): Promise<DonationLeaderboard> {
  return handleRequest<DonationLeaderboard>(
    api.get("/donations/leaderboard"),
    DonationLeaderboardSchema,
  );
}
