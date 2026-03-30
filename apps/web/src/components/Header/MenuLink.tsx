import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardFrame from "../../assets/dashboard-frame.svg?react";
import AnalitycsFrame from "../../assets/analitycs-frame.svg?react";
import TransactionsFrame from "../../assets/transactions-frame.svg?react";
import { useBurgerStore } from "../../store/burger";
export function MenuLink({ name }: { name: string }) {
  const { isMobile, closeBurger } = useBurgerStore();
  const pathname = usePathname();

  const handleClick = () => {
    if (isMobile) closeBurger();
  };
  return (
    <div
      className={
        `py-[12px] px-[16px]` +
        (pathname === "/" + name
          ? " bg-[var(--color-card)] rounded shadow"
          : "")
      }
    >
      <Link
        onClick={handleClick}
        href={`/${name}`}
        className="flex items-center gap-3 text-[var(--color-fixed-text)] hover:text-[var(--color-hover)] transitioned text-[17px] font-bold"
      >
        {name === "dashboard" && <DashboardFrame />}
        {name === "analytics" && <AnalitycsFrame />}
        {name === "transactions" && <TransactionsFrame />}

        {name[0].toUpperCase() + name.slice(1)}
      </Link>
    </div>
  );
}
