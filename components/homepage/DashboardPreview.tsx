import Image from "next/image";

export function DashboardPreview() {
  return (
    <section className="w-full pb-20 -mt-2 bg-background">
      <div className="mx-auto max-w-[1440px] px-6">
        {/* Browser frame */}
        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-border shadow-xl">
          {/* Browser top bar */}
          <div className="flex items-center gap-2 bg-surface-secondary px-4 py-3 border-b border-border">
            {/* Traffic lights */}
            <div className="flex items-center gap-1.5">
              <span className="block h-3 w-3 rounded-full bg-[#FF5F57]" />
              <span className="block h-3 w-3 rounded-full bg-[#FFBD2E]" />
              <span className="block h-3 w-3 rounded-full bg-[#27C93F]" />
            </div>
            {/* URL bar */}
            <div className="mx-auto flex items-center gap-1.5 rounded-md bg-surface px-4 py-1.5 text-xs text-text-muted">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>jobpilot.ai/dashboard</span>
            </div>
          </div>

          {/* Dashboard screenshot */}
          <Image
            src="/images/dashboard-demo.png"
            alt="JobPilot dashboard showing stats, recent activity, and company research chart"
            width={1440}
            height={800}
            className="w-full"
            priority
          />
        </div>
      </div>
    </section>
  );
}
