"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { insforge } from "@/lib/insforge";

// Marks that this browser session has already been through the sign-in reset.
// sessionStorage is wiped when the browser (or tab) is closed, so a brand-new
// visit always starts without it — which is exactly when we want to force a
// fresh sign-in.
const SESSION_FLAG = "jobpilot_session_started";

// App areas that require authentication. On a fresh browser session we send the
// user to /login instead of revealing these signed-out.
const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/find-jobs"];

/**
 * On the first load of every new browser session, clears any persisted sign-in
 * (the InsForge httpOnly refresh cookie) so the user must sign in again — the
 * app never auto-restores a previous session across browser opens.
 *
 * Renders nothing until the reset decision is made, so no child (e.g. the
 * Navbar) can flash a stale "Sign out" state.
 */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Already handled earlier in this browser session → normal navigation.
    if (sessionStorage.getItem(SESSION_FLAG)) {
      setReady(true);
      return;
    }
    sessionStorage.setItem(SESSION_FLAG, "1");

    // Never interrupt the OAuth return — that would kill a login in progress.
    if (pathname?.startsWith("/auth")) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Tells the backend to clear the httpOnly refresh cookie.
        await insforge.auth.signOut();
      } catch {
        // Ignore — we still clear local state and proceed.
      }
      // Clear the JS-readable session hint cookie too.
      document.cookie =
        "insforge-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

      if (cancelled) return;

      const isProtected = PROTECTED_PREFIXES.some((p) => pathname?.startsWith(p));
      if (isProtected) {
        // Full navigation so everything remounts in a clean signed-out state.
        window.location.replace("/login");
      } else {
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
