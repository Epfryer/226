import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth, authenticate, signOut, safeReturnTo } from "@/lib/auth";

type AccountScreen = "login" | "register" | "account";

function AccountFrame({ children, eyebrow = "D.EF / ACCOUNT" }: { children: ReactNode; eyebrow?: string }) {
  return (
    <section className="mx-auto flex min-h-[72dvh] w-full max-w-6xl items-center px-6 pb-20 pt-32 md:px-12">
      <div className="grid w-full grid-cols-1 gap-12 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)] md:gap-24">
        <div className="max-w-xl">
          <p className="mb-8 text-[10px] uppercase tracking-[.22em] text-foreground/55">{eyebrow}</p>
          {children}
        </div>
        <aside className="hidden border-l border-foreground/15 pl-8 md:block">
          <p className="max-w-[18rem] text-sm leading-7 text-foreground/65">
            A considered space for the work, notes and ongoing studies of the practice.
          </p>
          <p className="mt-10 text-[10px] uppercase tracking-[.18em] text-foreground/45">Private access</p>
        </aside>
      </div>
    </section>
  );
}

function AccountLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Checking account status</span>
      <div className="h-10 w-3/4 animate-pulse bg-foreground/10" />
      <div className="h-4 w-1/2 animate-pulse bg-foreground/10" />
      <div className="mt-10 h-12 w-full animate-pulse bg-foreground/10" />
    </div>
  );
}

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [, setLocation] = useLocation();
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const search = useSearch();
  const destination = safeReturnTo(new URLSearchParams(search).get("returnTo"));
  const isRegister = mode === "register";

  useEffect(() => {
    if (!auth.isError && auth.data?.user) setLocation(destination);
  }, [auth.data?.user, auth.isError, destination, setLocation]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await authenticate(mode, { username: username.trim(), password });
      setLocation(destination);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update your account. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (auth.isLoading) return <AccountFrame><AccountLoading /></AccountFrame>;

  return (
    <AccountFrame eyebrow={`D.EF / ${isRegister ? "REGISTER" : "SIGN IN"}`}>
      <h1 className="mb-3 text-4xl font-light tracking-[-.04em] md:text-5xl">
        {isRegister ? "Create access." : "Welcome back."}
      </h1>
      <p className="mb-10 text-sm leading-6 text-foreground/60">
        {isRegister ? "Create a visitor account. Browsing and checkout remain available without one." : "Sign in to your D.EF account."}
      </p>

      {auth.isError && (
        <div role="alert" className="mb-6 border-l border-foreground/40 pl-4 text-sm leading-6">
          <p>Account status could not be confirmed. Any previous session is treated as signed out.</p>
          <button type="button" onClick={() => auth.refetch()} className="mt-2 underline underline-offset-4">
            Try again
          </button>
        </div>
      )}
      {error && <p role="alert" className="mb-5 text-sm text-red-800">{error}</p>}

      <form onSubmit={submit} className="space-y-6">
        <div>
          <label htmlFor="account-username" className="mb-2 block text-[10px] uppercase tracking-[.16em]">Username</label>
          <input
            id="account-username"
            name="username"
            type="text"
            autoComplete={isRegister ? "username" : "username"}
            required
            minLength={3}
            maxLength={32}
            pattern="[a-zA-Z0-9_-]+"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby="username-help"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="min-h-12 w-full border-b border-foreground/35 bg-transparent px-0 py-3 text-base outline-none transition-colors focus:border-foreground"
          />
          <p id="username-help" className="mt-2 text-xs text-foreground/60">3–32 letters, numbers, underscores or hyphens. Not case-sensitive.</p>
        </div>
        <div>
          <label htmlFor="account-password" className="mb-2 block text-[10px] uppercase tracking-[.16em]">Password</label>
          <input
            id="account-password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={isRegister ? 12 : undefined}
            maxLength={128}
            aria-describedby="password-help"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-12 w-full border-b border-foreground/35 bg-transparent px-0 py-3 text-base outline-none transition-colors focus:border-foreground"
          />
          <p id="password-help" className="mt-2 text-xs text-foreground/60">Use 12–128 characters. Passwords are case-sensitive.</p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-4 min-h-12 border border-foreground px-6 text-[10px] uppercase tracking-[.18em] transition-colors hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Please wait…" : isRegister ? "Register" : "Sign in"}
        </button>
      </form>
      <p className="mt-8 text-sm text-foreground/60">
        {isRegister ? "Already registered? " : "New to D.EF? "}
        <Link className="text-foreground underline underline-offset-4" href={`${isRegister ? "/login" : "/register"}?returnTo=${encodeURIComponent(destination)}`}>
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
      <p className="mt-8 max-w-md text-xs leading-5 text-foreground/45">
        Forgot your password? Contact the site owner. Self-service recovery is not available.
      </p>
    </AccountFrame>
  );
}

export function LoginPage() {
  return <AuthForm mode="login" />;
}

export function RegisterPage() {
  return <AuthForm mode="register" />;
}

export function AccountPage() {
  const auth = useAuth();
  const [, setLocation] = useLocation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");
    try {
      await signOut();
      setLocation("/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (auth.isLoading) return <AccountFrame><AccountLoading /></AccountFrame>;
  if (auth.isError) {
    return (
      <AccountFrame>
        <h1 className="mb-4 text-4xl font-light tracking-[-.04em]">Account unavailable.</h1>
        <p role="alert" className="max-w-md text-sm leading-6 text-foreground/65">
          Your session could not be verified. For your privacy, account details are not shown.
        </p>
        <button type="button" onClick={() => auth.refetch()} className="mt-8 border-b border-foreground pb-2 text-[10px] uppercase tracking-[.18em]">
          Retry
        </button>
        <p className="mt-8 text-sm"><Link className="underline underline-offset-4" href="/login">Continue to sign in</Link></p>
      </AccountFrame>
    );
  }

  if (!auth.data?.user || pending) {
    return (
      <AccountFrame eyebrow="D.EF / ACCOUNT">
        <h1 className="mb-4 text-4xl font-light tracking-[-.04em]">{pending ? "Signing out…" : "You are signed out."}</h1>
        <p className="text-sm leading-6 text-foreground/60">
          {pending ? "Your private account details are hidden while sign out completes." : "You are anonymous, or your session has expired. Sign in or register to access your account."}
        </p>
        {!pending && <p className="mt-8 text-sm"><Link className="underline underline-offset-4" href="/login">Sign in</Link></p>}
        {error && <p role="alert" className="mt-6 text-sm text-red-800">{error}</p>}
      </AccountFrame>
    );
  }

  return (
    <AccountFrame eyebrow="D.EF / ACCOUNT">
      <p className="mb-5 text-[10px] uppercase tracking-[.2em] text-foreground/50">Account details</p>
      <h1 className="break-words text-4xl font-light tracking-[-.04em] md:text-5xl">{auth.data.user.username}</h1>
      <dl className="mt-10 flex max-w-md justify-between border-y border-foreground/20 py-5 text-sm">
        <dt className="text-foreground/55">Role</dt>
        <dd className="capitalize">{auth.data.user.role}</dd>
      </dl>
      {error && <p role="alert" className="mt-5 text-sm text-red-800">{error}</p>}
      <button
        type="button"
        onClick={logout}
        disabled={pending}
        className="mt-9 min-h-12 border border-foreground px-6 text-[10px] uppercase tracking-[.18em] transition-colors hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </AccountFrame>
  );
}

