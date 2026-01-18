import { useEffect } from "react";
import { MenuLink } from "./MenuLink";
import { SwitchTheme } from "./SwitchTheme";
import Logo from "../../assets/finance-icon.svg?react";
import { useBurgerStore } from "../../store/burger";
import { ProfileInfo } from "./ProfileInfo";
export function FixedHeader() {
	const { isBurgerOpen, toggleBurger, isMobile, setIsMobile } =
		useBurgerStore();

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
			className={`bg-[var(--color-fixed)] fixed z-10 top-0 left-0 transitioned p-[31px] 
        ${isMobile && !isBurgerOpen ? "h-[100px]" : ""} 
        ${isMobile ? "w-full" : "w-[300px] h-screen"} 
        ${isMobile && isBurgerOpen ? " h-screen" : ""}`}
		>
			{isMobile && (
				<div
					className={`flex border-b-2 justify-between items-center 
                ${isBurgerOpen ? "pb-[30px] border-[var(--color-text)]" : "border-transparent"}`}
				>
					<h2 className="roboto font-bold text-3xl flex items-center gap-2">
						<Logo className="fill-[var(--color-text)] w-10 h-10" />
						<span className="text-[var(--color-text)]">
							FinTrack
						</span>
					</h2>
					<button
						aria-label="Toggle menu"
						onClick={toggleBurger}
						className="group w-[36px] rounded-lg border-0 cursor-pointer"
					>
						<div className="grid justify-items-center gap-1.5">
							{[
								"rotate-45 translate-y-2.5",
								"scale-x-0",
								"-rotate-45 -translate-y-2.5",
							].map((cls, i) => (
								<span
									key={i}
									className={`h-1 w-9 bg-[var(--color-text)] rounded-full transition-all duration-500 ${
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
                ${isMobile && !isBurgerOpen ? "top-[-100%] opacity-0 invisible" : ""} 
                ${isMobile && isBurgerOpen ? "top-0 opacity-100 visible" : ""}`}
			>
				<nav role="navigation" className="gap-10">
					<ul className="border-b-2 pb-[20px] border-[var(--color-fixed-text)]">
						<MenuLink name="dashboard" />
						<MenuLink name="analitycs" />
						<MenuLink name="transactions" />
					</ul>
					<div className="mt-[20px] py-[12px] px-[10px] flex justify-center">
						<SwitchTheme />
					</div>
				</nav>
				<div className="py-[12px] w-full">
					<ProfileInfo />
				</div>
			</div>
		</header>
	);
}
