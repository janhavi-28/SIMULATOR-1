import Link from "next/link";
import { SITE_URL } from "@/lib/seo";
import { TRENDING_TOPICS_PHYSICS_SIMS } from "@/lib/data/simulation-mapping";
import { physicsTopicMeta } from "@/lib/registries/physics";

const colorClasses: Record<string, string> = {
  emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  sky: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  violet: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  cyan: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  teal: "border-teal-500/40 bg-teal-500/10 text-teal-300",
  indigo: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
  fuchsia: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300",
};

const simColors: Record<string, string> = {
  gravity: "emerald",
  "rutherford-gold-foil": "sky",
  "special-relativity": "amber",
  "general-relativity": "violet",
  "black-holes": "cyan",
  wormholes: "teal",
  "time-travel": "indigo",
  "double-slit": "sky",
  "quantum-superposition": "violet",
  "quantum-entanglement": "fuchsia",
  "quantum-tunneling": "emerald",
  "wave-function-collapse": "cyan",
  resonance: "amber",
};

export const metadata = {
  title: "Trending Topics – Physics Simulations",
  description: "Standalone physics simulations: gravity, Rutherford experiment, special relativity, general relativity, black holes, quantum mechanics. Free interactive demos for students.",
  keywords: ["physics simulations", "gravity simulation", "quantum mechanics", "relativity", "black holes", "trending topics physics"],
  alternates: { canonical: `${SITE_URL}/trending-topics/physics` },
  openGraph: {
    title: "Trending Topics – Physics | Illustrate.live",
    description: "Free interactive physics simulations: gravity, relativity, quantum mechanics, and more.",
    url: `${SITE_URL}/trending-topics/physics`,
  },
  robots: { index: true, follow: true },
};

export default function TrendingTopicsPhysicsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />
      <section className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Trending Topics – Physics
        </h1>
        <p className="mt-4 text-lg text-neutral-400">
          Standalone simulations not tied to High School or Senior Secondary syllabus.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TRENDING_TOPICS_PHYSICS_SIMS.map((slug) => {
            const meta = physicsTopicMeta[slug];
            const color = simColors[slug] ?? "cyan";
            if (!meta) return null;
            return (
              <Link
                key={slug}
                href={`/trending-topics/physics/${slug}`}
                className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900"
              >
                <div className="font-semibold text-white">{meta.title.split("|")[0].trim()}</div>
                <p className="mt-2 text-sm text-neutral-400 line-clamp-2">{meta.description}</p>
                <span
                  className={`mt-4 inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${colorClasses[color]}`}
                >
                  Live simulation
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
