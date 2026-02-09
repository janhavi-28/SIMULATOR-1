import Link from "next/link";
import { physicsSimulations } from "@/lib/data/simulations";
import { SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Illustrated Concepts – Interactive Science & Math",
  description: "Explore science, mathematics, and technology through interactive simulations. Visual-first learning for High School and Senior Secondary. Free physics, chemistry, and math simulations.",
  keywords: ["physics simulations", "interactive science", "math visualization", "educational simulations", "illustrate.live"],
  openGraph: {
    title: "Illustrate.live | Illustrated Concepts – Interactive Simulations",
    description: "Free interactive science and math simulations. Physics, chemistry, mathematics for High School and Senior Secondary.",
    type: "website",
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
};

const colorClasses: Record<string, string> = {
  emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 group-hover:border-emerald-400 group-hover:bg-emerald-500/15",
  sky: "border-sky-500/40 bg-sky-500/10 text-sky-300 group-hover:border-sky-400 group-hover:bg-sky-500/15",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-300 group-hover:border-amber-400 group-hover:bg-amber-500/15",
  violet: "border-violet-500/40 bg-violet-500/10 text-violet-300 group-hover:border-violet-400 group-hover:bg-violet-500/15",
  cyan: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 group-hover:border-cyan-400 group-hover:bg-cyan-500/15",
  teal: "border-teal-500/40 bg-teal-500/10 text-teal-300 group-hover:border-teal-400 group-hover:bg-teal-500/15",
  indigo: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300 group-hover:border-indigo-400 group-hover:bg-indigo-500/15",
  fuchsia: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300 group-hover:border-fuchsia-400 group-hover:bg-fuchsia-500/15",
};

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      {/* Background with clearer illustrations */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />
      <div className="absolute inset-0 -z-10 opacity-30">
        {/* Atom - left */}
        <svg className="absolute left-[8%] top-[15%] w-24 h-24 text-cyan-400/50" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="32" cy="32" r="4" fill="currentColor" />
          <ellipse cx="32" cy="32" rx="24" ry="8" strokeDasharray="4 4" transform="rotate(0 32 32)" />
          <ellipse cx="32" cy="32" rx="24" ry="8" strokeDasharray="4 4" transform="rotate(60 32 32)" />
          <ellipse cx="32" cy="32" rx="24" ry="8" strokeDasharray="4 4" transform="rotate(120 32 32)" />
        </svg>
        {/* Hexagon - center-right */}
        <svg className="absolute right-[20%] top-[20%] w-20 h-20 text-violet-400/50" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M32 8 L56 20 L56 44 L32 56 L8 44 L8 20 Z" />
        </svg>
        {/* DNA helix - top right */}
        <svg className="absolute right-[10%] top-[5%] w-28 h-28 text-emerald-400/50" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16 8 Q24 16 16 24 Q8 32 16 40 Q24 48 16 56" />
          <path d="M48 8 Q40 16 48 24 Q56 32 48 40 Q40 48 48 56" />
          <line x1="16" y1="16" x2="48" y2="24" strokeWidth="1" />
          <line x1="16" y1="32" x2="48" y2="40" strokeWidth="1" />
          <line x1="16" y1="48" x2="48" y2="56" strokeWidth="1" />
        </svg>
        {/* Flask - bottom left */}
        <svg className="absolute left-[5%] bottom-[20%] w-16 h-20 text-amber-400/50" viewBox="0 0 48 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M24 4 L24 24 L12 48 Q12 56 24 60 Q36 56 36 48 L24 24" />
        </svg>
        {/* Sine wave - bottom center */}
        <svg className="absolute left-[35%] bottom-[15%] w-32 h-12 text-pink-400/50" viewBox="0 0 128 32" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M0 16 Q32 0 64 16 Q96 32 128 16" />
        </svg>
        {/* Integral - bottom right */}
        <svg className="absolute right-[8%] bottom-[18%] w-14 h-20 text-orange-400/50" viewBox="0 0 56 80" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 16 Q24 8 16 40 Q8 72 24 64" />
          <path d="M48 16 Q32 8 40 40 Q48 72 32 64" />
        </svg>
      </div>

      {/* HERO + Simulations at TOP */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
            <span className="text-white">Illustrated </span>
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Concepts</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-neutral-400">
            Explore science, mathematics, and technology through beautiful interactive simulations.
            <span className="block mt-1">See concepts come alive with visual-first learning.</span>
          </p>
        </div>

        {/* Simulations grid – at top as requested */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-white mb-2">Interactive Simulations</h2>
          <p className="text-neutral-400 mb-8">Try these demos. Understanding begins with seeing.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {physicsSimulations.map((sim) => (
              <Link
                key={sim.slug}
                href={sim.href}
                className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
              >
                <div className="text-lg font-semibold text-white">{sim.title}</div>
                <p className="mt-2 text-sm text-neutral-400 line-clamp-2">{sim.description}</p>
                <span className={`mt-4 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium ${colorClasses[sim.color]}`}>
                  Live simulation · Open
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES - Why Illustrate */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Illustrate?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { title: "Interactive", desc: "Adjust values and instantly see changes in behavior, motion, or reactions." },
            { title: "Visual First", desc: "Designed to build intuition before formulas and definitions." },
            { title: "Concept Focused", desc: "Each page explains one idea deeply, not superficially." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8"
            >
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-neutral-400 text-base">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
