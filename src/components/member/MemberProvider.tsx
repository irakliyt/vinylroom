"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCurrentMember, login as doLogin, logout as doLogout, type Member } from "@/lib/wix/auth";
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

  useEffect(() => {
    let alive = true;
    getCurrentMember()
      .then((m) => alive && setMember(m))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (returnTo?: string) => {
    const path = returnTo ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    const res = await doLogin(path);
    if (res.status === "demo") setDemoNotice(true);
  }, []);

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

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
