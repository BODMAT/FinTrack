import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import type { AdminErrorLog, ErrorLogStatus } from "@fintrack/types";
import { formatDate } from "@/utils/admin";

interface AdminErrorLogsSectionProps {
  logStatusFilter: "ALL" | ErrorLogStatus;
  setLogStatusFilter: (value: "ALL" | ErrorLogStatus) => void;
  errorLogs: AdminErrorLog[];
  isLoading: boolean;
  errorMessage?: string;
  onToggleResolved: (errorLogId: string, resolved: boolean) => void;
  isResolvePendingForLog: (errorLogId: string) => boolean;
}

export function AdminErrorLogsSection({
  logStatusFilter,
  setLogStatusFilter,
  errorLogs,
  isLoading,
  errorMessage,
  onToggleResolved,
  isResolvePendingForLog,
}: AdminErrorLogsSectionProps) {
  const { t } = useSafeTranslation();

  return (
    <div className="neo-panel p-[20px] max-[1100px]:p-[16px]">
      <div className="mb-[16px] flex flex-wrap items-center justify-between gap-[12px]">
        <h2 className="text-[22px] font-bold text-(--color-title)">
          {t("admin.errors.title")}
        </h2>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={() => setLogStatusFilter("OPEN")}
            className={`cursor-pointer rounded-[8px] border px-[10px] py-[6px] text-[12px] font-semibold transition ${
              logStatusFilter === "OPEN"
                ? "border-(--color-hover) text-(--color-hover)"
                : "border-(--color-fixed-text) text-(--color-text)"
            }`}
          >
            {t("admin.errors.open")}
          </button>
          <button
            type="button"
            onClick={() => setLogStatusFilter("RESOLVED")}
            className={`cursor-pointer rounded-[8px] border px-[10px] py-[6px] text-[12px] font-semibold transition ${
              logStatusFilter === "RESOLVED"
                ? "border-(--color-hover) text-(--color-hover)"
                : "border-(--color-fixed-text) text-(--color-text)"
            }`}
          >
            {t("admin.errors.resolved")}
          </button>
          <button
            type="button"
            onClick={() => setLogStatusFilter("ALL")}
            className={`cursor-pointer rounded-[8px] border px-[10px] py-[6px] text-[12px] font-semibold transition ${
              logStatusFilter === "ALL"
                ? "border-(--color-hover) text-(--color-hover)"
                : "border-(--color-fixed-text) text-(--color-text)"
            }`}
          >
            {t("admin.errors.all")}
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="text-(--color-text)">{t("admin.errors.loading")}</p>
      )}
      {!!errorMessage && <p className="text-(--text-red)">{errorMessage}</p>}

      {!isLoading && !errorLogs.length && (
        <p className="text-(--color-text)">{t("admin.errors.empty")}</p>
      )}

      {!!errorLogs.length && (
        <div className="space-y-[12px]">
          {errorLogs.map((log) => (
            <article
              key={log.id}
              className="rounded-[12px] border border-(--stroke-soft) p-[14px]"
            >
              <div className="flex flex-wrap items-center justify-between gap-[10px]">
                <div>
                  <h3 className="text-[17px] font-semibold text-(--color-title)">
                    {log.title}
                  </h3>
                  <p className="mt-[4px] text-[12px] text-(--color-fixed-text)">
                    {log.user.name} ({log.user.role}) |{" "}
                    {formatDate(log.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-[999px] border px-[8px] py-[4px] text-[11px] font-bold ${
                    log.status === "OPEN"
                      ? "border-(--text-red) text-(--text-red)"
                      : "border-(--text-green) text-(--text-green)"
                  }`}
                >
                  {log.status}
                </span>
              </div>

              <p className="mt-[10px] whitespace-pre-wrap text-[14px] text-(--color-text)">
                {log.message}
              </p>

              {log.stack && (
                <pre className="mt-[10px] max-h-[180px] overflow-auto rounded-[8px] border border-(--stroke-soft) bg-black/20 p-[8px] text-[12px] text-(--color-fixed-text)">
                  {log.stack}
                </pre>
              )}

              <div className="mt-[12px] flex flex-wrap items-center gap-[8px] text-[12px] text-(--color-fixed-text)">
                <span>
                  {t("admin.errors.source")}: {log.source || "-"}
                </span>
                <span>|</span>
                <span>
                  {t("admin.errors.userAgent")}: {log.userAgent || "-"}
                </span>
                <span>|</span>
                <span>
                  {t("admin.errors.resolvedAt")}:{" "}
                  {log.resolvedAt ? formatDate(log.resolvedAt) : "-"}
                </span>
              </div>

              <div className="mt-[12px] flex flex-wrap gap-[8px]">
                <button
                  type="button"
                  onClick={() =>
                    onToggleResolved(log.id, log.status !== "RESOLVED")
                  }
                  disabled={isResolvePendingForLog(log.id)}
                  className="cursor-pointer rounded-[8px] border border-(--color-fixed-text) px-[10px] py-[6px] text-[12px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {log.status === "RESOLVED"
                    ? t("admin.errors.markOpen")
                    : t("admin.errors.markResolved")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
