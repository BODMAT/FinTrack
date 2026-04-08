import { useEffect } from "react";
import { MenuLink } from "./MenuLink";
import { SwitchTheme } from "./SwitchTheme";
import { SwitchLanguage } from "./SwitchLanguage";
import Logo from "@/assets/finance-icon.svg?react";
import { useBurgerStore } from "@/store/burger";
import { ProfileInfo } from "./ProfileInfo";
import { useAuth } from "@/hooks/useAuth";
export function FixedHeader() {
  const { isBurgerOpen, toggleBurger, isMobile, setIsMobile } =
    useBurgerStore();
  const { user } = useAuth();

  useEffect(() => {
    if (isMobile && isBurgerOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, [isBurgerOpen, isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (!mobile) {
        useBurgerStore.getState().closeBurger?.();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobile]);

  return (
    <header
      className={`glass-soft fixed z-10 top-0 left-0 transitioned p-7.75 border-r border-(--stroke-soft)
        ${isMobile && !isBurgerOpen ? "h-25" : ""} 
        ${isMobile ? "w-full" : "w-75 h-screen"} 
        ${isMobile && isBurgerOpen ? " h-screen" : ""}`}
    >
      {isMobile && (
        <div
          className={`flex border-b justify-between items-center 
                ${isBurgerOpen ? "pb-7.5 border-(--stroke-soft)" : "border-transparent"}`}
        >
          <h2 className="roboto font-bold text-3xl flex items-center gap-2">
            <Logo className="fill-(--color-hover) w-10 h-10" />
            <span className="text-(--color-text)">FinTrack</span>
          </h2>
          <button
            aria-label="Toggle menu"
            onClick={toggleBurger}
            className="group w-9 rounded-lg border-0 cursor-pointer"
          >
            <div className="grid justify-items-center gap-1.5">
              {[
                "rotate-45 translate-y-[10px]",
                "scale-x-0",
                "-rotate-45 -translate-y-[10px]",
              ].map((cls, i) => (
                <span
                  key={i}
                  className={`h-1 w-9 bg-(--color-text) rounded-full transition-all duration-500 ${
                    isBurgerOpen ? cls : ""
                  }`}
                ></span>
              ))}
            </div>
          </button>
        </div>
      )}

      <div
        className={`flex flex-col md:justify-between max-md:gap-10 max-md:my-5 h-full transitioned 
                ${isMobile && !isBurgerOpen ? "-top-full opacity-0 invisible" : ""} 
                ${isMobile && isBurgerOpen ? "top-0 opacity-100 visible" : ""}`}
      >
        <nav role="navigation" className="gap-10">
          <ul className="border-b pb-5 border-(--stroke-soft)">
            <MenuLink name="dashboard" />
            <MenuLink name="analytics" />
            <MenuLink name="transactions" />
            <MenuLink name="monobank" />
            {user?.role === "ADMIN" && <MenuLink name="admin" />}
          </ul>
          <div className="mt-3 py-3 px-2.5 flex justify-center">
            <div className="w-auto max-w-55">
              <SwitchTheme />
              <SwitchLanguage />
            </div>
          </div>
        </nav>
        <div className="py-3 w-full">
          <ProfileInfo />
        </div>
      </div>
    </header>
  );
}
