import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/useAuthStore";
import type { CreateUserBody as User } from "@fintrack/types";
import { usePopupStore } from "../../store/popup";
import { LoginPopup } from "./LoginPopup";

export function RegisterPopup() {
	const { open, close } = usePopupStore();
	const {
		user,
		status: { registerError, isRegistering },
		actions: { register, logout, login },
	} = useAuth();
	const { logout: localLogout } = useAuthStore();

	const [registerSuccess, setRegisterSuccess] = useState(false);
	const [userLocalInfo, setUserLocalInfo] = useState<User>({
		name: "",
		photo_url: null,
		authMethods: [
			{
				type: "EMAIL",
				email: "",
				password: "",
			},
			{
				type: "TELEGRAM",
				telegram_id: "",
			},
		],
	});

	const handleLogout = async () => {
		try {
			await logout();
			localLogout();
		} catch (error) {
			console.error(error);
		}
	};

	const handleOpenLoginPopup = () => {
		close();
		setTimeout(() => {
			open("Login", <LoginPopup />);
		}, 300);
	};

	const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setRegisterSuccess(false);

		const payload: User = {
			name: userLocalInfo.name.trim(),
			photo_url: userLocalInfo.photo_url?.trim() || null,
			authMethods: [],
		};

		const emailMethod = userLocalInfo.authMethods.find(
			(m) => m.type === "EMAIL",
		);
		if (
			emailMethod?.type === "EMAIL" &&
			emailMethod.email &&
			emailMethod.password
		) {
			payload.authMethods.push({
				type: "EMAIL",
				email: emailMethod.email.trim(),
				password: emailMethod.password,
			});
		}

		const tgMethod = userLocalInfo.authMethods.find(
			(m) => m.type === "TELEGRAM",
		);
		if (tgMethod?.type === "TELEGRAM" && tgMethod.telegram_id) {
			payload.authMethods.push({
				type: "TELEGRAM",
				telegram_id: tgMethod.telegram_id.trim(),
			});
		}

		if (payload.authMethods.length === 0) {
			return;
		}

		try {
			await register(payload);
			setRegisterSuccess(true);

			//! if email - auto login ======================================
			if (emailMethod) {
				await login({
					email: emailMethod.email,
					password: emailMethod.password,
				});
			}
			//!=============================================================

			setUserLocalInfo({
				name: "",
				photo_url: null,
				authMethods: [
					{
						type: "EMAIL",
						email: "",
						password: "",
					},
					{
						type: "TELEGRAM",
						telegram_id: "",
					},
				],
			});
		} catch (error) {
			setRegisterSuccess(false);
			console.error("Registration failed", error);
		} finally {
			setTimeout(() => {
				setRegisterSuccess(false);
			}, 5000);
		}
	};

	return (
		<section className="flex items-center flex-col gap-5 w-full">
			<form
				onSubmit={(e) => {
					handleRegister(e);
				}}
				className="flex flex-col gap-5 w-full"
			>
				<input
					required
					value={userLocalInfo.name}
					type="text"
					placeholder="Name"
					onChange={(e) =>
						setUserLocalInfo({
							...userLocalInfo,
							name: e.target.value,
						})
					}
					className="custom-input"
				/>
				<input
					type="url"
					value={userLocalInfo.photo_url || ""}
					placeholder="Photo url (optional)"
					onChange={(e) =>
						setUserLocalInfo({
							...userLocalInfo,
							photo_url: e.target.value,
						})
					}
					className="custom-input"
				/>
				<span className="h-[2px] w-full bg-[var(--color-background)] rounded" />
				<div className="flex justify-between gap-5 text-center flex-col">
					<input
						required
						type="email"
						placeholder="Email"
						value={
							userLocalInfo.authMethods.find(
								(m) => m.type === "EMAIL",
							)?.email || ""
						}
						onChange={(e) => {
							const newValue = e.target.value;
							setUserLocalInfo((prev) => ({
								...prev,
								authMethods: prev.authMethods.map((method) =>
									method.type === "EMAIL"
										? { ...method, email: newValue }
										: method,
								),
							}));
						}}
						className="custom-input"
					/>
					<input
						required
						minLength={8}
						type="password"
						placeholder="Password"
						value={
							userLocalInfo.authMethods.find(
								(m) => m.type === "EMAIL",
							)?.password || ""
						}
						onChange={(e) => {
							const newValue = e.target.value;
							setUserLocalInfo((prev) => ({
								...prev,
								authMethods: prev.authMethods.map((method) =>
									method.type === "EMAIL"
										? { ...method, password: newValue }
										: method,
								),
							}));
						}}
						className="custom-input"
					/>
					<input
						type="text"
						placeholder="Telegram id (optional)"
						value={
							userLocalInfo.authMethods.find(
								(m) => m.type === "TELEGRAM",
							)?.telegram_id || ""
						}
						onChange={(e) => {
							const newValue = e.target.value;
							setUserLocalInfo((prev) => ({
								...prev,
								authMethods: prev.authMethods.map((method) =>
									method.type === "TELEGRAM"
										? { ...method, telegram_id: newValue }
										: method,
								),
							}));
						}}
						className="custom-input"
					/>
					<button
						type="submit"
						disabled={isRegistering}
						className="custom-btn"
					>
						Register new account
					</button>
				</div>

				<div className="">
					{registerSuccess && (
						<span className="text-green-500">
							User created successfully
						</span>
					)}
					{registerError && (
						<span className="text-red-500">{registerError}</span>
					)}
					{isRegistering && <span>Loading...</span>}
				</div>
				<span className="h-[2px] w-full bg-[var(--color-background)] rounded" />
			</form>
			<div className="w-full flex gap-5 justify-space-between">
				{user && (
					<button onClick={handleLogout} className="custom-btn">
						Log out
					</button>
				)}
				<button onClick={handleOpenLoginPopup} className="custom-btn">
					Log in
				</button>
			</div>
		</section>
	);
}
