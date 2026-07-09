import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="JobPilot logo"
            width={28}
            height={28}
            className="rounded-[8px]"
          />
          <span className="text-base font-bold text-text-darkest">
            JobPilot
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Terms &amp; Condition
          </Link>
        </div>
      </div>
    </footer>
  );
}
