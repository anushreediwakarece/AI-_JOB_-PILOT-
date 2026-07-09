"use client";

import Link from "next/link";
import { usePostHog } from "posthog-js/react";

export function BottomCTA() {
  const posthog = usePostHog();
  return (
    <section className="w-full bg-overlay py-20">
      <div className="mx-auto max-w-[1440px] px-6 text-center">
        <h2 className="mx-auto max-w-xl text-[36px] font-bold leading-[44px] tracking-tight text-white md:text-[42px] md:leading-[50px]">
          Your next job search can feel a lot less overwhelming
        </h2>

        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-white/70">
          Set up your profile, upload your resume, and start finding matches in
          minutes.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/login"
            onClick={() => posthog.capture('bottom_cta_get_started_clicked')}
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
            onClick={() => posthog.capture('bottom_cta_find_match_clicked')}
            className="inline-flex items-center rounded-md border border-white/20 bg-transparent px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Find Your First Match
          </Link>
        </div>
      </div>
    </section>
  );
}
