"use client";

import { useEffect } from "react";
import { insforge } from "@/lib/insforge";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const posthog = usePostHog();
  
  useEffect(() => {
    // The SDK automatically parses the URL hash and saves the session in memory.
    insforge.auth.getCurrentUser().then(({ data: { user } }) => {
      if (user) {
        posthog.capture('login_success');
        // Set a dummy cookie so middleware knows we have a session
        document.cookie = `insforge-auth=true; path=/; max-age=31536000; SameSite=Lax`;
        // Use client-side navigation to preserve the in-memory SDK session
        router.push("/dashboard");
      } else {
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      }
    }).catch(() => {
      router.push("/login");
    });
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto mb-4"></div>
        <p className="text-text-secondary font-medium">Authenticating...</p>
      </div>
    </div>
  );
}
