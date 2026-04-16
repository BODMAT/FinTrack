import type { AdminUser } from "@fintrack/types";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface AdminUserActionsProps {
  adminUser: AdminUser;
  canDemote: boolean;
  onPromote: (userId: string) => void;
  onDemote: (userId: string) => void;
  onRevokeUserSessions: (userId: string) => void;
  isRolePending: boolean;
  isSessionPending: boolean;
}

export function AdminUserActions({
  adminUser,
  canDemote,
  onPromote,
  onDemote,
  onRevokeUserSessions,
  isRolePending,
  isSessionPending,
}: AdminUserActionsProps) {
  const { t } = useSafeTranslation();

  return (
    <div className="flex flex-wrap gap-[8px]">
      {adminUser.role === "USER" && (
        <button
          type="button"
          onClick={() => onPromote(adminUser.id)}
          disabled={isRolePending}
          className="cursor-pointer rounded-[8px] border border-(--color-fixed-text) px-[10px] py-[6px] text-[12px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("admin.users.makeAdmin")}
        </button>
      )}

      {canDemote && (
        <button
          type="button"
          onClick={() => onDemote(adminUser.id)}
          disabled={isRolePending}
          className="cursor-pointer rounded-[8px] border border-(--text-red) px-[10px] py-[6px] text-[12px] font-semibold text-(--text-red) transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("admin.users.removeAdmin")}
        </button>
      )}

      <button
        type="button"
        onClick={() => onRevokeUserSessions(adminUser.id)}
        disabled={isSessionPending}
        className="cursor-pointer rounded-[8px] border border-(--color-fixed-text) px-[10px] py-[6px] text-[12px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("admin.users.logoutUser")}
      </button>
    </div>
  );
}
