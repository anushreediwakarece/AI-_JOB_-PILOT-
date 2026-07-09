"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

export function Hero() {
  const posthog = usePostHog();
  return (
    <section className="w-full bg-gradient-to-b from-surface-tertiary to-background pt-20 pb-16">
      <div className="mx-auto max-w-[1440px] px-6 text-center">
        {/* Headline */}
        <h1 className="mx-auto max-w-2xl text-[44px] font-bold leading-[52px] tracking-tight text-text-darkest md:text-[52px] md:leading-[60px]">
          Job hunting is hard.{" "}
          <span className="block">Your tools shouldn&apos;t be.</span>
        </h1>

        {/* Subline */}
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-text-secondary">
          Stop applying blind. JobPilot finds the jobs, researches the
          companies, and gives you everything you need to stand out.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/login"
            onClick={() => posthog.capture('hero_get_started_clicked')}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm hover:bg-accent-dark transition-colors"
          >
            Get Started
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="ml-0.5"
            >
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/find-jobs"
            onClick={() => posthog.capture('hero_find_match_clicked')}
            className="inline-flex items-center rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary shadow-sm hover:bg-surface-secondary transition-colors"
          >
            Find Your First Match
          </Link>
        </div>
      </div>
    </section>
  );
}
