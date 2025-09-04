import { useState } from "react";
import { ProfileInfo } from "./ProfileInfo";
import { useUser } from "../../hooks/useUser";

export function ProfileInfoPopup() {
    const { user, login, logout, isLoading } = useUser();

    const [nickname, setNickname] = useState(user?.nickname || "");
    const [password, setPassword] = useState(user?.password || "");

    const handleSave = () => {
        if (!nickname || !password) return;
        login({ nickname, password });
        setNickname("");
        setPassword("");
    };

    return (
        <section className="flex items-center flex-col gap-5 w-full">
            <div className="flex items-center gap-10">
                <ProfileInfo />
                <div className="flex flex-col gap-2 flex-1/2">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="bg-[var(--text-green)] hover:bg-[var(--bg-green)]
              text-[var(--color-text)] font-bold py-2 px-4 rounded
              focus:outline-none focus:shadow-outline cursor-pointer transitioned"
                    >
                        {isLoading ? "Loading..." : "Log in"}
                    </button>
                    {user && (
                        <button
                            type="button"
                            onClick={logout}
                            className="bg-[var(--text-red)] hover:bg-[var(--bg-red)]
              text-[var(--color-text)] font-bold py-2 px-4 rounded
              focus:outline-none focus:shadow-outline cursor-pointer transitioned"
                        >
                            {isLoading ? "Loading..." : "Log out"}
                        </button>)}
                </div>
            </div>

            <form className="flex gap-5 p-4 max-md:flex-col">
                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-[var(--color-fixed-text)]"
                    >
                        Telegram nickname
                    </label>
                    <input
                        placeholder="Nickname from telegram"
                        type="text"
                        id="name"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="text-[var(--color-text)] mt-2 block w-full border rounded p-2
              focus:outline-none focus:ring focus:ring-[var(--color-hover)]"
                    />
                </div>
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-[var(--color-fixed-text)]"
                    >
                        Password
                    </label>
                    <input
                        placeholder="Password from telegram"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="text-[var(--color-text)] mt-2 block w-full border rounded p-2
              focus:outline-none focus:ring focus:ring-[var(--color-hover)]"
                    />
                </div>
            </form>
        </section >
    );
}
