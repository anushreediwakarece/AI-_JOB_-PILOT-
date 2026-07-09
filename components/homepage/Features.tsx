import Image from "next/image";

export function Features() {
  return (
    <>
      {/* Feature Section 1 — Manage Your Job Search With Ease */}
      <section className="w-full bg-background py-20">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 md:grid-cols-2 lg:gap-20 lg:px-16">
          {/* Left — text */}
          <div>
            <h2 className="text-[36px] font-bold leading-[44px] tracking-tight text-text-darkest md:text-[40px] md:leading-[48px]">
              Manage Your Job{" "}
              <span className="block">Search With Ease</span>
            </h2>

            <div className="mt-10 space-y-8">
              <FeatureItem
                title="Find jobs that actually fit"
                description="Search by title or location or paste a job link. Get matched roles you can quickly scan."
              />
              <FeatureItem
                title="Know the Company Before You Apply"
                description="Stop guessing what a company is about. JobPilot browses their site and gives you everything you need to apply with confidence."
              />
              <FeatureItem
                title="Keep track of every application"
                description="Keep a clear view of every job you've found, tailored. Your activity and progress all stay in one simple place."
              />
            </div>
          </div>

          {/* Right — jobs list image */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
            <Image
              src="/images/jobs-lists.png"
              alt="Job list showing companies like Vercel, Stripe, Linear with match scores and salaries"
              width={600}
              height={500}
              className="w-full"
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* Feature Section 2 — Apply With More Confidence */}
      <section className="w-full bg-background py-20">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 md:grid-cols-2 lg:gap-20 lg:px-16">
          {/* Left — agent log image */}
          <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
            <Image
              src="/images/agnet-log.png"
              alt="Agent log showing system initialization, scan results, and resume tailoring actions"
              width={600}
              height={500}
              className="w-full"
              unoptimized
            />
          </div>

          {/* Right — text */}
          <div>
            <h2 className="text-[36px] font-bold leading-[44px] tracking-tight text-text-darkest md:text-[40px] md:leading-[48px]">
              Apply With More{" "}
              <span className="block">Confidence, Every Time</span>
            </h2>

            <div className="mt-10 space-y-8">
              <FeatureItem
                title="Understand your match score"
                description="See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what's missing."
              />
              <FeatureItem
                title="AI-Powered Job Matching"
                description="Stop guessing which jobs are worth applying to. JobPilot scores every role against your actual skills so you focus on the ones that matter."
              />
              <FeatureItem
                title="Focus on the right roles"
                description="Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying."
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

type FeatureItemProps = {
  title: string;
  description: string;
};

function FeatureItem({ title, description }: FeatureItemProps) {
  return (
    <div className="border-l-2 border-border pl-5">
      <h3 className="text-base font-semibold leading-6 text-text-primary">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-6 text-text-secondary">
        {description}
      </p>
    </div>
  );
}
