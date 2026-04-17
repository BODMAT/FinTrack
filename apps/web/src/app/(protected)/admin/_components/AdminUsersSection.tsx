import type { AdminUser } from "@fintrack/types";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { AdminUserActions } from "./AdminUserActions";
import { formatDate, getPreferredUserContact } from "@/utils/admin";

interface AdminUsersSectionProps {
  users: AdminUser[];
  selfUserId?: string;
  isLoading: boolean;
  errorMessage?: string;
  isRevokingAll: boolean;
  onRevokeAll: () => void;
  onPromote: (userId: string) => void;
  onDemote: (userId: string) => void;
  onRevokeUserSessions: (userId: string) => void;
  isRolePendingForUser: (userId: string) => boolean;
  isSessionPendingForUser: (userId: string) => boolean;
}

export function AdminUsersSection({
  users,
  selfUserId,
  isLoading,
  errorMessage,
  isRevokingAll,
  onRevokeAll,
  onPromote,
  onDemote,
  onRevokeUserSessions,
  isRolePendingForUser,
  isSessionPendingForUser,
}: AdminUsersSectionProps) {
  const { t } = useSafeTranslation();

  return (
    <div className="neo-panel p-[20px] max-[1100px]:p-[16px]">
      <div className="mb-[16px] flex flex-wrap items-center justify-between gap-[12px]">
        <h2 className="text-[22px] font-bold text-(--color-title)">
          {t("admin.users.title")}
        </h2>
        <button
          type="button"
          onClick={onRevokeAll}
          disabled={isRevokingAll}
          className="cursor-pointer rounded-[10px] border border-(--color-fixed-text) px-[14px] py-[8px] text-[14px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRevokingAll
            ? t("admin.users.loggingOutAll")
            : t("admin.users.logoutAllSessions")}
        </button>
      </div>

      {isLoading && (
        <p className="text-(--color-text)">{t("admin.users.loading")}</p>
      )}
      {!!errorMessage && <p className="text-(--text-red)">{errorMessage}</p>}

      {!isLoading && !users.length && (
        <p className="text-(--color-text)">{t("admin.users.empty")}</p>
      )}

      {!!users.length && (
        <div className="overflow-x-auto max-[1100px]:hidden">
          <table className="w-full min-w-[840px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-(--stroke-soft) text-(--color-fixed-text)">
                <th className="px-[8px] py-[10px]">
                  {t("admin.users.columns.name")}
                </th>
                <th className="px-[8px] py-[10px]">
                  {t("admin.users.columns.contact")}
                </th>
                <th className="px-[8px] py-[10px]">
                  {t("admin.users.columns.role")}
                </th>
                <th className="px-[8px] py-[10px]">
                  {t("admin.users.columns.verified")}
                </th>
                <th className="px-[8px] py-[10px]">
                  {t("admin.users.columns.created")}
                </th>
                <th className="px-[8px] py-[10px]">
                  {t("admin.users.columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((adminUser) => {
                const canDemote =
                  adminUser.role === "ADMIN" && adminUser.id !== selfUserId;

                return (
                  <tr
                    key={adminUser.id}
                    className="border-b border-(--stroke-soft) align-top"
                  >
                    <td className="px-[8px] py-[12px] text-(--color-title)">
                      {adminUser.name}
                    </td>
                    <td className="px-[8px] py-[12px] text-(--color-text)">
                      {getPreferredUserContact(adminUser)}
                    </td>
                    <td className="px-[8px] py-[12px] text-(--color-text)">
                      {adminUser.role}
                    </td>
                    <td className="px-[8px] py-[12px] text-(--color-text)">
                      {adminUser.isVerified
                        ? t("admin.users.yes")
                        : t("admin.users.no")}
                    </td>
                    <td className="px-[8px] py-[12px] text-(--color-text)">
                      {formatDate(adminUser.created_at)}
                    </td>
                    <td className="px-[8px] py-[12px]">
                      <AdminUserActions
                        adminUser={adminUser}
                        canDemote={canDemote}
                        onPromote={onPromote}
                        onDemote={onDemote}
                        onRevokeUserSessions={onRevokeUserSessions}
                        isRolePending={isRolePendingForUser(adminUser.id)}
                        isSessionPending={isSessionPendingForUser(adminUser.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!!users.length && (
        <div className="hidden space-y-[12px] max-[1100px]:block">
          {users.map((adminUser) => {
            const canDemote =
              adminUser.role === "ADMIN" && adminUser.id !== selfUserId;

            return (
              <article
                key={adminUser.id}
                className="rounded-[12px] border border-(--stroke-soft) p-[12px]"
              >
                <div className="flex items-start justify-between gap-[10px]">
                  <div className="min-w-0 flex-1">
                    <div className="max-w-full overflow-x-auto pb-[2px]">
                      <h3 className="w-max min-w-full whitespace-nowrap text-[16px] font-semibold text-(--color-title)">
                        {adminUser.name}
                      </h3>
                    </div>
                    <div className="mt-[4px] max-w-full overflow-x-auto pb-[2px]">
                      <p className="w-max min-w-full whitespace-nowrap text-[13px] text-(--color-text)">
                        {getPreferredUserContact(adminUser)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-[999px] border border-(--stroke-soft) px-[8px] py-[3px] text-[11px] font-bold text-(--color-fixed-text)">
                    {adminUser.role}
                  </span>
                </div>

                <div className="mt-[10px] grid grid-cols-2 gap-[8px] text-[12px] text-(--color-fixed-text) max-[560px]:grid-cols-1">
                  <span>
                    {t("admin.users.columns.verified")}:{" "}
                    {adminUser.isVerified
                      ? t("admin.users.yes")
                      : t("admin.users.no")}
                  </span>
                  <span>
                    {t("admin.users.columns.created")}:{" "}
                    {formatDate(adminUser.created_at)}
                  </span>
                </div>

                <div className="mt-[12px]">
                  <AdminUserActions
                    adminUser={adminUser}
                    canDemote={canDemote}
                    onPromote={onPromote}
                    onDemote={onDemote}
                    onRevokeUserSessions={onRevokeUserSessions}
                    isRolePending={isRolePendingForUser(adminUser.id)}
                    isSessionPending={isSessionPendingForUser(adminUser.id)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
