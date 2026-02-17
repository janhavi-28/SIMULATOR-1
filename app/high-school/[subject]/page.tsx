import Link from "next/link";

const subjectLabels: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  maths: "Mathematics",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const label = subjectLabels[subject] ?? subject;
  return {
    title: `High School ${label} | Illustrate.live`,
    description: `High School ${label} – chapters and topics.`,
  };
}

export default async function HighSchoolSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const label = subjectLabels[subject] ?? subject;

  const isPhysics = subject === "physics";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />
      <section className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          High School {label}
        </h1>
        <p className="mt-4 text-lg text-neutral-400">
          {isPhysics
            ? "Choose a chapter to explore interactive simulations."
            : "Chapters and topics. Content coming soon."}
        </p>

        {isPhysics && (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Link
              href="/high-school/physics/light"
              className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:bg-neutral-900"
            >
              <h2 className="text-xl font-semibold text-white">
                Chapter: Light
              </h2>
              <p className="mt-2 text-sm text-neutral-400">
                Explore a vivid scattering-style simulator connecting units and
                physical quantities to the behavior of light‑like particles.
              </p>
              <span className="mt-4 inline-flex rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
                Live simulation · Open
              </span>
            </Link>
          </div>
        )}

        <Link
          href="/"
          className="mt-10 inline-block rounded-xl border border-neutral-600 px-6 py-3 text-neutral-300 hover:bg-neutral-800 transition"
        >
          ← Back to Illustrate
        </Link>
      </section>
    </main>
  );
}
