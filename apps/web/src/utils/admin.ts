import type { AdminUser } from "@fintrack/types";

export function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function getPreferredUserContact(user: AdminUser) {
  const emailMethod = user.authMethods.find((item) => item.type === "EMAIL");
  if (emailMethod?.email) return emailMethod.email;

  const telegramMethod = user.authMethods.find(
    (item) => item.type === "TELEGRAM",
  );
  if (telegramMethod?.telegram_id) return `tg:${telegramMethod.telegram_id}`;

  const googleMethod = user.authMethods.find((item) => item.type === "GOOGLE");
  if (googleMethod?.google_sub) return `google:${googleMethod.google_sub}`;

  return "-";
}
