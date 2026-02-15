import { useState } from "react";
import type { LoginUserBody } from "@fintrack/types";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/useAuthStore";
import { RegisterPopup } from "./RegisterPopup";
import { usePopupStore } from "../../store/popup";

export function LoginPopup() {
  const { open, close } = usePopupStore();
  const {
    user,
    status: { loginError, isLoggingIn },
    actions: { login, logout },
  } = useAuth();
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { logout: localLogout } = useAuthStore();
  const [loginFields, setLoginFields] = useState<LoginUserBody>({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginSuccess(false);
    try {
      await login(loginFields);
      setLoginSuccess(true);
      setLoginFields({
        email: "",
        password: "",
      });
    } catch (error) {
      setLoginSuccess(false);
      console.error("Login failed", error);
    } finally {
      setTimeout(() => {
        setLoginSuccess(false);
      }, 5000);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      localLogout();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenRegisterPopup = () => {
    close();
    setTimeout(() => {
      open("Register New Profile", <RegisterPopup />);
    }, 300);
  };

  return (
    <section className="flex items-center flex-col gap-5 w-full">
      <form
        onSubmit={(e) => {
          handleLogin(e);
        }}
        className="flex flex-col gap-5 w-full"
      >
        <input
          required
          type="email"
          placeholder="Email"
          value={loginFields.email}
          onChange={(e) => {
            setLoginFields((prev) => ({
              ...prev,
              email: e.target.value,
            }));
          }}
          className="custom-input"
        />
        <input
          required
          minLength={8}
          type="password"
          placeholder="Password"
          value={loginFields.password}
          onChange={(e) => {
            setLoginFields((prev) => ({
              ...prev,
              password: e.target.value,
            }));
          }}
          className="custom-input"
        />
        <button type="submit" disabled={isLoggingIn} className="custom-btn">
          Login into account
        </button>

        <div className="">
          {loginSuccess && (
            <span className="text-green-500">User login successfully</span>
          )}
          {loginError && <span className="text-red-500">{loginError}</span>}
          {isLoggingIn && <span>Loading...</span>}
        </div>
        <span className="h-[2px] w-full bg-[var(--color-background)] rounded" />
      </form>
      <div className="w-full flex gap-5 justify-space-between">
        {user && (
          <button onClick={handleLogout} className="custom-btn">
            Log out
          </button>
        )}
        <button onClick={handleOpenRegisterPopup} className="custom-btn">
          Register new
        </button>
      </div>
    </section>
  );
}
