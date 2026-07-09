import { getBrowserClient, saveTokens, clearTokens, resetBrowserClient } from "./browser";
import { routeUrl } from "@/lib/site";

const OAUTH_KEY = "wix:oauth-data";
export const LOGIN_CALLBACK_PATH = "/login-callback";

export type Member = {
  id?: string;
  name: string;
  email?: string;
  initials: string;
} | null;

export class LoginCallbackError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "LoginCallbackError";
  }
}

function initials(name?: string): string {
  if (!name) return "♪";
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Kick off Wix member login: mint PKCE data, stash it, and redirect to the
 * Wix-hosted auth page. Returns `demo` (no redirect) when unconfigured.
 */
export async function login(returnTo = "/"): Promise<{ status: "redirect" | "demo" }> {
  const client = getBrowserClient();
  if (!client) return { status: "demo" };

  const redirectUri = routeUrl(LOGIN_CALLBACK_PATH);
  const oauthData = client.auth.generateOAuthData(redirectUri, returnTo);
  sessionStorage.setItem(OAUTH_KEY, JSON.stringify(oauthData));
  const { authUrl } = await client.auth.getAuthUrl(oauthData);
  window.location.href = authUrl;
  return { status: "redirect" };
}

export async function loginWithPassword(email: string, password: string): Promise<Member> {
  const client = getBrowserClient();
  if (!client) throw new LoginCallbackError("Connect a Wix Headless client ID first.", "demo");

  const result = await client.auth.login({ email, password });
  if (result.loginState !== "SUCCESS" || !result.data?.sessionToken) {
    const failure = result as { error?: string; errorCode?: string; loginState: string };
    throw new LoginCallbackError(
      failure.error || "Wix could not sign in with those details.",
      failure.errorCode || failure.loginState,
    );
  }

  const tokens = await client.auth.getMemberTokensForDirectLogin(result.data.sessionToken);
  client.auth.setTokens(tokens);
  saveTokens(tokens);
  resetBrowserClient();
  return getCurrentMember();
}

/** Complete login on the callback route: exchange the code for member tokens. */
export async function completeLogin(): Promise<string> {
  const client = getBrowserClient();
  if (!client) return "/";

  const raw = sessionStorage.getItem(OAUTH_KEY);
  const oauthData = raw ? JSON.parse(raw) : null;
  if (!oauthData) return "/";

  const parsed = client.auth.parseFromUrl(window.location.href);
  if (parsed.error) {
    throw new LoginCallbackError(parsed.errorDescription || parsed.error, parsed.error);
  }

  const { code, state } = parsed;
  const tokens = await client.auth.getMemberTokens(code, state, oauthData);
  client.auth.setTokens(tokens);
  saveTokens(tokens);
  sessionStorage.removeItem(OAUTH_KEY);
  return oauthData.originalUri || "/";
}

export async function logout(): Promise<void> {
  const client = getBrowserClient();
  clearTokens();
  if (!client) {
    resetBrowserClient();
    return;
  }
  try {
    const { logoutUrl } = await client.auth.logout(window.location.origin);
    resetBrowserClient();
    window.location.href = logoutUrl;
  } catch {
    resetBrowserClient();
    window.location.reload();
  }
}

export function isLoggedIn(): boolean {
  const client = getBrowserClient();
  return !!client && client.auth.loggedIn();
}

/** Current member's display identity, or `null` if signed out / unconfigured. */
export async function getCurrentMember(): Promise<Member> {
  const client = getBrowserClient();
  if (!client || !client.auth.loggedIn()) return null;
  try {
    const res = (await client.members.getCurrentMember()) as Record<string, unknown>;
    const m = ((res.member ?? res) ?? {}) as Record<string, unknown>;
    const profile = (m.profile ?? {}) as Record<string, unknown>;
    const contact = (m.contact ?? {}) as Record<string, unknown>;
    const email = m.loginEmail as string | undefined;
    const name =
      (profile.nickname as string) ||
      [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
      email ||
      "Listener";
    return { id: m._id as string, name, email, initials: initials(name) };
  } catch {
    return null;
  }
}
