import request from "supertest";
import { app } from "../../src/app.js";
import { generateAccessToken } from "../../src/modules/auth/controller.js";
import * as userService from "../../src/modules/user/service.js";
import { AppError } from "../../src/middleware/errorHandler.js";

describe("User Integration", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("uses current user id from token for deleting auth method (/me path)", async () => {
    const currentUserId = "66ba6cb3-3a2d-4fd9-8a61-30f5ad4fd897";
    const authMethodId = "5c8dff72-a6f7-4293-af7a-7c7f6190c020";

    const accessToken = generateAccessToken({
      id: currentUserId,
      email: "me@test.dev",
      telegram_id: null,
      role: "USER",
      isVerified: true,
    });

    const deleteSpy = jest
      .spyOn(userService, "deleteAuthMethod")
      .mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/users/me/auth-methods/${authMethodId}`)
      .set("Cookie", [`fintrack_access_token=${accessToken}`]);

    expect(response.status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith(currentUserId, authMethodId);
  });

  it("returns 404 for /api/users/me/auth-methods/:id when service does not find method", async () => {
    const currentUserId = "5b0e88d2-5a89-4b11-96ab-8936d5117aa6";
    const authMethodId = "97552032-a5b4-4be3-90f8-b2e9f22ab44f";

    const accessToken = generateAccessToken({
      id: currentUserId,
      email: "me@test.dev",
      telegram_id: null,
      role: "USER",
      isVerified: true,
    });

    jest
      .spyOn(userService, "deleteAuthMethod")
      .mockRejectedValue(new AppError("Auth method not found", 404));

    const response = await request(app)
      .delete(`/api/users/me/auth-methods/${authMethodId}`)
      .set("Cookie", [`fintrack_access_token=${accessToken}`]);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Auth method not found");
  });
});
