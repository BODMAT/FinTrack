import { usePopupStore } from "../../store/popup";
import ArrToBottom from "../../assets/arr-to-bottom.svg?react";
import AnonimusIcon from "../../assets/anonymous-user-icon.svg?react";
import { RegisterPopup } from "./RegisterPopup";
import { useAuth } from "../../hooks/useAuth";
export function ProfileInfo() {
	const { user, isLoading, isError } = useAuth();
	const { open } = usePopupStore();
	const handleOpenPopup = () => {
		open("Register New Profile", <RegisterPopup />);
	};
	return (
		<button
			onClick={handleOpenPopup}
			className="flex items-center gap-[10px] text-[var(--color-fixed-text)] transitioned text-[17px] font-bold group max-md:mx-auto cursor-pointer bg-transparent hover:bg-[var(--color-card)] rounded hover:shadow p-2 w-full justify-between max-md:max-w-[300px]"
		>
			<div className="w-[45px] h-[45px] rounded-full bg-[var(--color-hover-reverse)]">
				{user && user.photo_url ? (
					<div className="flex w-[45px] h-[45px] justify-center items-center">
						<img
							className="w-[45px] h-[45px] object-cover rounded-full"
							src={user.photo_url}
							alt="user photo"
						/>
					</div>
				) : (
					<div className="flex justify-center items-center h-full">
						<AnonimusIcon className="w-[45px] h-[45px] opacity-80 rounded-full fill-current transitioned group-hover:opacity-100" />
					</div>
				)}
			</div>
			<div className="flex flex-col">
				{isLoading && <span className="text-[16px]">Loading...</span>}
				{!isLoading && user && (
					<span className="overflow-hidden">
						<div className="overflow-hidden">
							{user.name ?? "Anonimus"}
						</div>
						<div className="text-[8px] mt-1 overflow-hidden">
							{user.authMethods
								.filter((auth) => auth.type === "EMAIL")
								.map((auth) => auth.email)
								.join(", ")}
						</div>
						<div className="text-[8px] mt-1 overflow-hidden">
							{user.authMethods
								.filter((auth) => auth.type === "TELEGRAM")
								.map((auth) => auth.telegram_id)
								.join(", ")}
						</div>
					</span>
				)}
				{!isLoading && !user && (
					<span className="text-[16px]">Add profile</span>
				)}
				{isError && (
					<span className="text-[8px] text-[var(--color-red)]">
						Try again
					</span>
				)}
			</div>
			<ArrToBottom className="w-[20px] h-[20px] fill-current text-[var(--color-fixed-text)] transition-all duration-500 rotate-[-90deg] group-hover:rotate-0" />
		</button>
	);
}
