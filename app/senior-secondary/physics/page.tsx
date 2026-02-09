import Link from "next/link";
import { SITE_URL } from "@/lib/seo";
import { physicsChapters } from "@/lib/data/senior-secondary-physics";

export const metadata = {
  title: "Senior Secondary Physics – Chapters & Simulations",
  description: "Senior Secondary Physics syllabus: kinematics, gravitation, thermodynamics, waves, and more. Interactive simulations for projectile motion, velocity-time graphs, and kinematic equations.",
  keywords: ["senior secondary physics", "Class 11 physics", "Class 12 physics", "physics chapters", "kinematics simulation"],
  alternates: { canonical: `${SITE_URL}/senior-secondary/physics` },
  openGraph: {
    title: "Senior Secondary Physics | Illustrate.live",
    description: "Physics chapters and interactive simulations for Senior Secondary students.",
    url: `${SITE_URL}/senior-secondary/physics`,
  },
  robots: { index: true, follow: true },
};

export default function SeniorSecondaryPhysicsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />
      <section className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Senior Secondary Physics
        </h1>
        <p className="mt-4 text-lg text-neutral-400">
          Choose a chapter to explore topics and interactive illustrations.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {physicsChapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/senior-secondary/physics/${chapter.id}`}
              className="group rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-800"
            >
              <h2 className="text-xl font-semibold text-white">{chapter.title}</h2>
              <div className="mt-4 text-sm font-medium text-neutral-300 group-hover:text-white">
                Open chapter →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
