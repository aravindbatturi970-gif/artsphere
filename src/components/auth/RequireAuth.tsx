import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@/types";

/**
 * Blocks rendering until authenticated; optionally enforces a single role.
 * Unauthenticated visitors are sent to /sign-in with a `from` redirect.
 * Wrong-role users land on their own dashboard instead.
 */
export function RequireAuth({
  children,
  role,
}: {
  children: ReactNode;
  role?: UserRole;
}) {
  const { ready, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-ink-400">
          <span className="size-2 animate-pulse rounded-full bg-brass-500" />
          Checking your session…
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
    );
  }

  if (role && user.role !== role) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return <>{children}</>;
}
