"use client";

import Link from "next/link";
import Image from "next/image";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge";

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const posthog = usePostHog();
  const router = useRouter();

  useEffect(() => {
    // Get current user on mount
    insforge.auth.getCurrentUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleSignOut = async () => {
    posthog.capture('clicked_sign_out');
    await insforge.auth.signOut();
    document.cookie = `insforge-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    setUser(null);
    router.push("/");
  };

  return (
    <header className="w-full bg-surface border-b border-border">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2"
          onClick={() => posthog.capture('clicked_logo')}
        >
          <Image
            src="/logo.png"
            alt="JobPilot logo"
            width={36}
            height={36}
            className="rounded-[10px]"
          />
          <span className="text-[19px] font-bold leading-7 text-text-darkest">
            JobPilot
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium leading-5 text-text-dark hover:text-accent transition-colors"
            onClick={() => posthog.capture('clicked_dashboard')}
          >
            Dashboard
          </Link>
          <Link
            href="/find-jobs"
            className="text-sm font-medium leading-5 text-text-dark hover:text-accent transition-colors"
            onClick={() => posthog.capture('clicked_find_jobs')}
          >
            Find Jobs
          </Link>
          <Link
            href="/profile"
            className="text-sm font-medium leading-5 text-text-dark hover:text-accent transition-colors"
            onClick={() => posthog.capture('clicked_profile')}
          >
            Profile
          </Link>
        </div>

        {/* CTA */}
        {user ? (
          <button
            onClick={handleSignOut}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-dark hover:bg-surface-secondary transition-colors"
          >
            Sign out
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-overlay-dark px-4 py-2 text-sm font-medium text-white hover:bg-overlay transition-colors"
            onClick={() => posthog.capture('clicked_start_for_free')}
          >
            Start for free
          </Link>
        )}
      </nav>
    </header>
  );
}
