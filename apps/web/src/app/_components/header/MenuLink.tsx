import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardFrame from "@/assets/dashboard-frame.svg?react";
import AnalyticsFrame from "@/assets/analytics-frame.svg?react";
import TransactionsFrame from "@/assets/transactions-frame.svg?react";
import MonobankFrame from "@/assets/monobank.svg?react";
import { useBurgerStore } from "@/store/burger";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
export function MenuLink({ name }: { name: string }) {
  const { t } = useSafeTranslation();
  const { isMobile, closeBurger } = useBurgerStore();
  const pathname = usePathname();
  const isActive = pathname.endsWith(`/${name}`);
  const monobankLabel = t("nav.monobank");
  const adminLabel = t("nav.admin");
  const donationLabel = t("nav.donation");
  const label =
    name === "admin"
      ? adminLabel === "nav.admin"
        ? "Admin Panel"
        : adminLabel
      : name === "donation"
        ? donationLabel
        : name === "monobank"
          ? monobankLabel === "nav.monobank"
            ? "Monobank API"
            : monobankLabel
          : t(`nav.${name}`);

  const handleClick = () => {
    if (isMobile) closeBurger();
  };
  return (
    <div
      className={
        `py-2 px-2.5 rounded-[12px] transitioned` +
        (isActive ? " bg-(--color-hover-reverse) neon-outline" : "")
      }
    >
      <Link
        onClick={handleClick}
        href={`/${name}`}
        className="group flex items-center gap-3 px-[8px] py-[8px] text-(--color-fixed-text) transitioned text-[17px] font-bold hover:text-(--color-hover)"
      >
        {name === "dashboard" && <DashboardFrame />}
        {name === "analytics" && <AnalyticsFrame />}
        {name === "transactions" && <TransactionsFrame />}
        {name === "monobank" && (
          <MonobankFrame className="h-5 w-5 text-(--color-fixed-text) transition-colors group-hover:text-(--color-hover)" />
        )}
        {name === "admin" && (
          <span className="flex h-5 w-5 items-center justify-center rounded-[6px] border border-(--color-fixed-text) text-[10px] leading-none font-black transition-colors group-hover:border-(--color-hover) group-hover:text-(--color-hover)">
            AD
          </span>
        )}
        {name === "donation" && (
          <span className="flex h-5 w-5 items-center justify-center rounded-[6px] border border-(--color-fixed-text) text-[10px] leading-none font-black transition-colors group-hover:border-(--color-hover) group-hover:text-(--color-hover)">
            DS
          </span>
        )}

        {label}
      </Link>
    </div>
  );
}
