import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/homepage/Hero";
import { DashboardPreview } from "@/components/homepage/DashboardPreview";
import { Features } from "@/components/homepage/Features";
import { Testimonial } from "@/components/homepage/Testimonial";
import { BottomCTA } from "@/components/homepage/BottomCTA";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col w-full">
        {/* Theme selector — Bright / Dark */}
        <div className="w-full max-w-[1440px] mx-auto px-6 pt-5 flex items-center justify-end gap-3">
          <span className="text-sm text-text-secondary">Appearance</span>
          <ThemeToggle />
        </div>
        <Hero />
        <DashboardPreview />
        <Features />
        <Testimonial />
        <BottomCTA />
      </main>
      <Footer />
    </>
  );
}