import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardFrame from "@/assets/dashboard-frame.svg?react";
import AnalyticsFrame from "@/assets/analytics-frame.svg?react";
import TransactionsFrame from "@/assets/transactions-frame.svg?react";
import { useBurgerStore } from "@/store/burger";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
export function MenuLink({ name }: { name: string }) {
  const { t } = useSafeTranslation();
  const { isMobile, closeBurger } = useBurgerStore();
  const pathname = usePathname();
  const isActive = pathname.endsWith(`/${name}`);

  const handleClick = () => {
    if (isMobile) closeBurger();
  };
  return (
    <div
      className={
        `py-3 px-4` + (isActive ? " bg-(--color-card) rounded shadow" : "")
      }
    >
      <Link
        onClick={handleClick}
        href={`/${name}`}
        className="flex items-center gap-3 text-(--color-fixed-text) hover:text-(--color-hover) transitioned text-[17px] font-bold"
      >
        {name === "dashboard" && <DashboardFrame />}
        {name === "analytics" && <AnalyticsFrame />}
        {name === "transactions" && <TransactionsFrame />}

        {t(`nav.${name}`)}
      </Link>
    </div>
  );
}
