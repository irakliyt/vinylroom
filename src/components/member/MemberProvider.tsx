"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  getCurrentMember,
  loginWithPassword,
  logout as doLogout,
  registerMember,
  type Member,
} from "@/lib/wix/auth";
import { isWixConfigured } from "@/lib/wix/config";

type MemberCtx = {
  member: Member;
  loading: boolean;
  configured: boolean;
  demoNotice: boolean;
  login: (returnTo?: string) => void;
  logout: () => void;
  dismissDemo: () => void;
};

const Ctx = createContext<MemberCtx | null>(null);

export function useMember() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMember must be used within <MemberProvider>");
  return ctx;
}

export function MemberProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member>(null);
  const [loading, setLoading] = useState(true);
  const [demoNotice, setDemoNotice] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [returnTo, setReturnTo] = useState("/");
  const [authMode, setAuthMode] = useState<"sign-in" | "register">("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getCurrentMember()
      .then((m) => alive && setMember(m))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback((returnTo?: string) => {
    const path = returnTo ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    if (!isWixConfigured) {
      setDemoNotice(true);
      return;
    }
    setReturnTo(path);
    setLoginError("");
    setAuthMode("sign-in");
    setLoginOpen(true);
  }, []);

  const submitAuth = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoginBusy(true);
      setLoginError("");
      try {
        const nextMember =
          authMode === "register"
            ? await registerMember(email.trim(), password, displayName)
            : await loginWithPassword(email.trim(), password);
        setMember(nextMember);
        setLoginOpen(false);
        setPassword("");
        setDisplayName("");
        if (returnTo && returnTo !== window.location.pathname) {
          window.location.href = returnTo;
        }
      } catch (err) {
        setLoginError(
          err instanceof Error
            ? err.message
            : authMode === "register"
              ? "Could not create that account."
              : "Could not sign in.",
        );
      } finally {
        setLoginBusy(false);
      }
    },
    [authMode, displayName, email, password, returnTo],
  );

  const logout = useCallback(async () => {
    setMember(null);
    await doLogout();
  }, []);

  const value = useMemo<MemberCtx>(
    () => ({
      member,
      loading,
      configured: isWixConfigured,
      demoNotice,
      login,
      logout,
      dismissDemo: () => setDemoNotice(false),
    }),
    [member, loading, demoNotice, login, logout],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {loginOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-void/80 px-5 backdrop-blur-md">
          <button
            aria-label="Close sign in"
            className="absolute inset-0 clickable"
            onClick={() => setLoginOpen(false)}
          />
          <form
            onSubmit={submitAuth}
            className="relative w-full max-w-sm rounded-2xl border border-edge bg-pitch/95 p-5 text-left shadow-[0_24px_80px_-30px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow">
                  {authMode === "register" ? "Member registration" : "Member sign in"}
                </div>
                <h2 className="mt-2 font-display text-2xl leading-tight text-cream">
                  {authMode === "register"
                    ? "Create a Wix Member account."
                    : "Keep your bookings with your account."}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setLoginOpen(false)}
                className="text-dust transition-colors hover:text-cream clickable"
              >
                x
              </button>
            </div>

            {authMode === "register" && (
              <label className="mt-5 block">
                <span className="text-[0.62rem] uppercase tracking-[0.18em] text-dust">Name</span>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-edge bg-void/50 px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-dust focus:border-amber/60"
                />
              </label>
            )}

            <label className="mt-5 block">
              <span className="text-[0.62rem] uppercase tracking-[0.18em] text-dust">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-edge bg-void/50 px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-dust focus:border-amber/60"
              />
            </label>

            <label className="mt-3 block">
              <span className="text-[0.62rem] uppercase tracking-[0.18em] text-dust">Password</span>
              <input
                type="password"
                autoComplete={authMode === "register" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-edge bg-void/50 px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-dust focus:border-amber/60"
              />
            </label>

            {loginError && <p className="mt-3 text-sm text-amber">{loginError}</p>}

            <button
              type="submit"
              disabled={loginBusy}
              className="mt-5 w-full rounded-full py-3.5 text-sm font-medium text-void disabled:cursor-not-allowed disabled:opacity-50 clickable"
              style={{
                background: "linear-gradient(135deg,#e8b45f,#b45f2a)",
                boxShadow: "0 16px 40px -14px rgba(216,154,69,0.6)",
              }}
            >
              {loginBusy
                ? authMode === "register"
                  ? "Creating account..."
                  : "Signing in..."
                : authMode === "register"
                  ? "Create account"
                  : "Sign in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode((mode) => (mode === "register" ? "sign-in" : "register"));
                setLoginError("");
                setPassword("");
              }}
              className="mt-4 w-full text-center text-sm text-parchment transition-colors hover:text-amber clickable"
            >
              {authMode === "register" ? "Already a member? Sign in" : "New here? Create account"}
            </button>
          </form>
        </div>
      )}
    </Ctx.Provider>
  );
}
