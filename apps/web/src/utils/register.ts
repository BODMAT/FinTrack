import type { CreateUserBody as User } from "@fintrack/types";

export function createInitialUserLocalInfo(): User {
  return {
    name: "",
    photo_url: null,
    authMethods: [
      {
        type: "EMAIL",
        email: "",
        password: "",
      },
      {
        type: "TELEGRAM",
        telegram_id: "",
      },
    ],
  };
}
