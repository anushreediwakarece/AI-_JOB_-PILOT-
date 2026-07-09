import Image from "next/image";

export function Testimonial() {
  return (
    <section className="w-full bg-background py-20">
      <div className="mx-auto max-w-[1440px] px-6 text-center">
        {/* Label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Success Stories
        </p>

        {/* Quote */}
        <blockquote className="mx-auto mt-6 max-w-2xl text-[22px] font-semibold leading-8 text-text-darkest md:text-[24px] md:leading-9">
          &ldquo;I used to spend my evenings copy-pasting resumes. Now I open my
          dashboard to see interviews waiting. It feels like cheating. Had 3
          offers on the table simultaneously.&rdquo;
        </blockquote>

        {/* Author */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Image
            src="/images/user-icon.png"
            alt="Tom Wilson"
            width={48}
            height={48}
            className="rounded-full"
            unoptimized
          />
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Tom Wilson
            </p>
            <p className="text-xs text-text-muted">Junior Developer</p>
          </div>
        </div>
      </div>
    </section>
  );
}
