"use client";

import { useState, useEffect } from "react";
import { insforge } from "@/lib/insforge";
import { Navbar } from "@/components/layout/Navbar";
import { ShieldCheck, Globe, GitBranch } from "lucide-react";
import { usePostHog } from "posthog-js/react";

export default function LoginPage() {
  const posthog = usePostHog();
  const [loading, setLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data: { user } }) => {
      if (user) {
        window.location.href = "/dashboard";
      }
    });
  }, []);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    posthog.capture('login_attempt', { provider });
    setLoading(provider);
    setErrorMsg(null);
    try {
      const { data, error } = await insforge.auth.signInWithOAuth(provider, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        posthog.capture('login_error', { provider, error_message: error.message });
        console.error("Login failed:", error);
        setErrorMsg(error.message || "An error occurred during sign in. Please try again.");
        setLoading(null);
      } else if (data?.url) {
        // If SDK doesn't auto-redirect, we manually redirect here
        window.location.href = data.url;
      }
    } catch (e: any) {
      console.error("Login exception:", e);
      setErrorMsg(e.message || "An unexpected error occurred.");
      setLoading(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-80px)] bg-background flex flex-col pt-12 px-6 items-center">
        <div className="w-full max-w-[1040px] mt-8 bg-surface rounded-[32px] border border-border shadow-lg overflow-hidden flex flex-col md:flex-row min-h-[560px]">
          
          {/* Left Panel */}
          <div className="relative w-full md:w-1/2 p-12 lg:p-16 flex flex-col justify-between bg-accent-muted border-r border-border">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface shadow-sm border border-border text-text-secondary text-xs font-semibold mb-10">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  OAuth secured by InsForge
               </div>
               <h1 className="text-[44px] lg:text-[52px] leading-[1.05] font-bold text-text-darkest tracking-tight mb-6">
                 Sign in and let the agent prep your next application.
               </h1>
               <p className="text-text-secondary text-[16px] leading-relaxed max-w-[400px]">
                 Connect with Google or GitHub to start building your profile, matching jobs, and creating tailored application materials.
               </p>
            </div>
            <p className="text-xs text-text-muted font-medium mt-16">
              New users are routed to profile setup after sign-in.
            </p>
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-1/2 p-12 lg:p-16 flex flex-col justify-center bg-surface">
            <div className="max-w-[320px] w-full mx-auto">
              <p className="text-[13px] font-medium text-text-secondary mb-1">Welcome to</p>
              <h2 className="text-[28px] font-bold text-text-darkest mb-10">JobPilot</h2>
              <p className="text-[13px] font-medium text-text-secondary mb-6">Choose your preferred provider to continue.</p>
              
              {errorMsg && (
                <div className="mb-4 rounded-lg bg-error/10 p-3 text-sm text-error font-medium border border-error/20">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading !== null}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-surface-secondary px-4 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-tertiary border border-transparent disabled:opacity-50"
                >
                  <Globe className="w-4 h-4 text-accent" />
                  {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
                </button>
                
                <button
                   onClick={() => handleOAuthLogin('github')}
                   disabled={loading !== null}
                   className="flex w-full items-center justify-center gap-3 rounded-xl bg-surface border border-border px-4 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary shadow-sm disabled:opacity-50"
                >
                   <GitBranch className="w-4 h-4 text-text-dark" />
                   {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
