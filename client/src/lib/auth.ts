import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

export type AccountUser = { id: number; username: string; role: "visitor" | "owner" };
export type AuthState = { user: AccountUser | null; csrfToken: string };
export const authKey = ["/api/auth/me"];
export function useAuth() {
  return useQuery<AuthState>({
    queryKey: authKey, staleTime: 0, refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Accounts are temporarily unavailable. Please try again.");
      return response.json();
    },
  });
}
export async function authenticate(action: "login" | "register", values: { username: string; password: string }) {
  return mutateAuth(action, values);
}
export async function signOut() { return mutateAuth("logout", {}); }
async function mutateAuth(action: string, values: object): Promise<AuthState> {
  const fresh = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
  if (!fresh.ok) throw new Error("Accounts are temporarily unavailable. Please try again.");
  const state: AuthState = await fresh.json();
  const response = await fetch(`/api/auth/${action}`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": state.csrfToken },
    body: JSON.stringify(values),
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) queryClient.setQueryData(authKey, { user: null, csrfToken: "" });
    throw new Error(result.error || "Unable to update your account. Please try again.");
  }
  await queryClient.cancelQueries({ queryKey: authKey });
  queryClient.setQueryData(authKey, result);
  return result;
}
export function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/account";
  const path = value.split(/[?#]/)[0];
  return ["/login", "/register"].includes(path) ? "/account" : value;
}
