import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  getSupabase,
  getSupabaseSessionOnly,
  isSupabaseConfigured,
} from "@/lib/supabase";
import type { UserProfile, UserRole } from "@/types";

/**
 * Authentication context.
 *
 * - When Supabase credentials are configured (.env.local), all flows run
 *   against real Supabase Auth: sign-up, sign-in, reset, sign-out, and
 *   `profiles` rows (see supabase/schema.sql) loaded per user.
 * - Without credentials the app runs in DEMO MODE: identical API, local
 *   mock users, clearly badged in the UI, so the flows stay reviewable
 *   before the project is wired up.
 */

export type AuthActionState = "idle" | "submitting" | "success" | "error";

interface AuthResult {
  error: string | null;
  /** True when sign-up succeeded but email confirmation is pending. */
  needsConfirmation?: boolean;
}

interface AuthContextValue {
  ready: boolean;
  session: Session | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  demoMode: boolean;
  signUp: (input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<AuthResult>;
  signIn: (input: { email: string; password: string; remember: boolean }) => Promise<AuthResult>;
  signOutUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------------------------ Supabase ------------------------------ */

function rowToProfile(row: {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
}): UserProfile {
  const role = row.role;
  return {
    id: row.id,
    fullName: row.full_name ?? "Unnamed user",
    email: row.email ?? "",
    role:
      role === "artist" || role === "admin" || role === "buyer"
        ? role
        : "buyer",
    avatarUrl: row.avatar_url,
    bio: row.bio,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/**
 * Load the profile row for a Supabase user. The DB trigger (see
 * supabase/schema.sql) creates the row at sign-up; if it is missing we
 * fall back to metadata so the UI still works.
 */
async function loadProfile(user: User): Promise<UserProfile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile:", error.message);
  }
  if (data) return rowToProfile(data);

  // Fallback: mirror what the trigger would have written.
  const metadata = user.user_metadata ?? {};
  const role = metadata.role as string | undefined;
  return {
    id: user.id,
    fullName: (metadata.full_name as string | undefined) ?? "Unnamed user",
    email: user.email ?? "",
    role:
      role === "artist" || role === "admin" || role === "buyer"
        ? role
        : "buyer",
    avatarUrl: null,
    bio: null,
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

/* ------------------------------- Demo --------------------------------- */

const DEMO_KEY = "artsphere:demo-users";
const DEMO_SESSION_KEY = "artsphere:demo-session";

interface DemoRecord {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  bio: string | null;
  createdAt: string;
  /** Stage 9: disabled accounts cannot sign in; active sessions end. */
  accountStatus?: "active" | "disabled";
}

function readDemoUsers(): DemoRecord[] {
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as DemoRecord[]) : [];
  } catch {
    return [];
  }
}

function writeDemoUsers(users: DemoRecord[]): void {
  try {
    window.localStorage.setItem(DEMO_KEY, JSON.stringify(users));
  } catch {
    // Storage unavailable — session-scoped demo users only.
  }
}

function demoToProfile(record: DemoRecord): UserProfile {
  return {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    role: record.role,
    avatarUrl: null,
    bio: record.bio,
    createdAt: record.createdAt,
  };
}

/**
 * Account-status map written by the admin layer (Stage 9). Kept separate
 * from the user records so both admin and auth layers agree without
 * rewriting records; the map is the live source of truth.
 */
function disabledAccounts(): Set<string> {
  try {
    const raw = window.localStorage.getItem("artsphere:account-status");
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== "object" || parsed === null) return new Set();
    return new Set(
      Object.entries(parsed as Record<string, string>)
        .filter(([, status]) => status === "disabled")
        .map(([id]) => id)
    );
  } catch {
    return new Set();
  }
}

/* ------------------------------ Provider ------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const demoMode = !isSupabaseConfigured;

  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Initial load: restore session (Supabase) or demo session.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (demoMode) {
        try {
          const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
          if (raw) {
            const record = readDemoUsers().find((u) => u.id === raw);
            // A disabled account's session does not survive a reload.
            if (
              record &&
              record.accountStatus !== "disabled" &&
              !disabledAccounts().has(record.id)
            ) {
              setUser(demoToProfile(record));
            } else if (record) {
              window.localStorage.removeItem(DEMO_SESSION_KEY);
            }
          }
        } catch {
          // Ignore corrupt demo sessions.
        }
        if (!cancelled) setReady(true);
        return;
      }

      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session?.user) {
        setSession(data.session);
        setUser(await loadProfile(data.session.user));
      }
      if (!cancelled) setReady(true);

      // Keep auth state in sync across tabs and token refreshes.
      const { data: sub } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
          if (newSession?.user) {
            void loadProfile(newSession.user).then((profile) => {
              if (!cancelled) setUser(profile);
            });
          } else {
            setUser(null);
          }
        }
      );
      return () => sub.subscription.unsubscribe();
    }

    const cleanup = init();
    return () => {
      cancelled = true;
      void cleanup?.then?.((fn?: () => void) => fn?.());
    };
  }, [demoMode]);

  const signUp = useCallback(
    async (input: {
      fullName: string;
      email: string;
      password: string;
      role: UserRole;
    }): Promise<AuthResult> => {
      if (demoMode) {
        const users = readDemoUsers();
        const email = input.email.trim().toLowerCase();
        if (users.some((u) => u.email === email)) {
          return { error: "An account with this email already exists." };
        }
        const record: DemoRecord = {
          id: `demo-${crypto.randomUUID()}`,
          fullName: input.fullName.trim(),
          email,
          password: input.password, // Demo only — never done in production.
          role: input.role,
          bio: null,
          createdAt: new Date().toISOString(),
        };
        writeDemoUsers([...users, record]);
        try {
          window.localStorage.setItem(DEMO_SESSION_KEY, record.id);
        } catch {
          // Session persists only in memory then.
        }
        setUser(demoToProfile(record));
        return { error: null };
      }

      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            full_name: input.fullName.trim(),
            role: input.role,
          },
        },
      });

      if (error) return { error: error.message };
      // Email confirmation may be required before a session exists.
      return {
        error: null,
        needsConfirmation: !data.session && Boolean(data.user),
      };
    },
    [demoMode]
  );

  const signIn = useCallback(
    async (input: {
      email: string;
      password: string;
      remember: boolean;
    }): Promise<AuthResult> => {
      if (demoMode) {
        const users = readDemoUsers();
        const email = input.email.trim().toLowerCase();
        const record = users.find((u) => u.email === email);
        if (!record || record.password !== input.password) {
          return { error: "Invalid email or password." };
        }
        if (
          record.accountStatus === "disabled" ||
          disabledAccounts().has(record.id)
        ) {
          return {
            error:
              "This account has been disabled by an administrator. Contact support if you believe this is a mistake.",
          };
        }
        try {
          if (input.remember) {
            window.localStorage.setItem(DEMO_SESSION_KEY, record.id);
          } else {
            window.sessionStorage.setItem(DEMO_SESSION_KEY, record.id);
          }
        } catch {
          // In-memory only then.
        }
        setUser(demoToProfile(record));
        return { error: null };
      }

      // Remember me: the persistent client stores the session in
      // localStorage; otherwise a sessionStorage-backed client keeps the
      // session tab-only. The session-only client emits no events on the
      // persistent client's listener, so we apply its session manually.
      if (input.remember) {
        const { error } = await getSupabase().auth.signInWithPassword({
          email: input.email.trim(),
          password: input.password,
        });
        if (error) return { error: error.message };
        return { error: null };
      }

      const sessionOnly = getSupabaseSessionOnly();
      const { data, error } = await sessionOnly.auth.signInWithPassword({
        email: input.email.trim(),
        password: input.password,
      });
      if (error) return { error: error.message };
      if (data.session?.user) {
        setSession(data.session);
        setUser(await loadProfile(data.session.user));
      }
      return { error: null };
    },
    [demoMode]
  );

  const signOutUser = useCallback(async () => {
    if (demoMode) {
      try {
        window.localStorage.removeItem(DEMO_SESSION_KEY);
        window.sessionStorage.removeItem(DEMO_SESSION_KEY);
      } catch {
        // Nothing to clean up.
      }
      setUser(null);
      return;
    }
    // Sign out of both clients so a non-remembered session is fully cleared.
    await getSupabase().auth.signOut();
    const { error } = await getSupabaseSessionOnly().auth.signOut();
    if (error) console.error("Sign-out error:", error.message);
    setUser(null);
    setSession(null);
  }, [demoMode]);

  const requestPasswordReset = useCallback(
    async (email: string): Promise<AuthResult> => {
      if (demoMode) {
        return { error: null };
      }
      const { error } = await getSupabase().auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );
      if (error) return { error: error.message };
      return { error: null };
    },
    [demoMode]
  );

  const value = useMemo(
    () => ({
      ready,
      session,
      user,
      isAuthenticated: user !== null,
      demoMode,
      signUp,
      signIn,
      signOutUser,
      requestPasswordReset,
    }),
    [ready, session, user, demoMode, signUp, signIn, signOutUser, requestPasswordReset]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

/** Route helper: where each role lands after sign-in. */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case "artist":
      return "/dashboard/artist";
    case "admin":
      return "/admin";
    default:
      return "/dashboard/buyer";
  }
}
