import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Explore – High School, Senior Secondary & Trending Topics",
  description: "Explore interactive science and math simulations. High School (Physics, Chemistry, Maths), Senior Secondary syllabus, and Trending Topics for standalone concepts.",
  keywords: ["explore simulations", "high school science", "senior secondary", "trending topics", "physics chemistry maths"],
  alternates: { canonical: `${SITE_URL}/subjects` },
  robots: { index: true, follow: true },
};

export default function SubjectsPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />
      <section className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Explore
        </h1>
        <p className="mt-4 text-lg text-neutral-400">
          Choose a level to explore subjects and simulations.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Link
            href="/high-school/physics"
            className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600"
          >
            <h2 className="text-xl font-semibold text-white">High School</h2>
            <p className="mt-2 text-sm text-neutral-400">Physics, Chemistry, Mathematics</p>
          </Link>
          <Link
            href="/senior-secondary/physics"
            className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600"
          >
            <h2 className="text-xl font-semibold text-white">Senior Secondary</h2>
            <p className="mt-2 text-sm text-neutral-400">Physics, Chemistry, Mathematics</p>
          </Link>
          <Link
            href="/trending-topics/physics"
            className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600"
          >
            <h2 className="text-xl font-semibold text-white">Trending Topics</h2>
            <p className="mt-2 text-sm text-neutral-400">Physics, Chemistry, Maths, Biology</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
