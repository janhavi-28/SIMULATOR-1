import Link from "next/link";

const subjectLabels: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  maths: "Mathematics",
};

const physicsChapters = [
  {
    href: "/high-school/physics/motion",
    title: "Motion and Mechanics",
    description: "Kinematics, force, Newton's laws, inertia, and momentum with interactive simulations.",
  },
  {
    href: "/high-school/physics/gravitation-fluids",
    title: "Gravitation and Fluids",
    description: "Explore gravity, pressure, buoyancy, and Archimedes principle through visual simulations.",
  },
  {
    href: "/high-school/physics/electricity",
    title: "Electricity",
    description: "Build intuition for charge, current, voltage, resistance, and basic circuit behavior.",
  },
  {
    href: "/high-school/physics/magnetism",
    title: "Magnetism",
    description: "Understand magnetic fields, electromagnetic effects, and generator concepts.",
  },
  {
    href: "/high-school/physics/light",
    title: "Light and Optics",
    description: "Reflection, refraction, lenses, and optics concepts with interactive chapter content.",
  },
  {
    href: "/high-school/physics/sound",
    title: "Sound",
    description: "Wave properties, pitch, wavelength, and reflection of sound with guided simulators.",
  },
  {
    href: "/high-school/physics/work-energy-power",
    title: "Work, Energy, and Power",
    description: "Energy transfer, conservation, and power in everyday and lab-style scenarios.",
  },
  {
    href: "/high-school/physics/matter-density-states",
    title: "Matter, Density, and States",
    description: "Particle-level understanding of states of matter, density, and related properties.",
  },
  {
    href: "/high-school/physics/sources-of-energy",
    title: "Sources of Energy",
    description: "Renewable and non-renewable energy sources with process-focused visual explainers.",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const label = subjectLabels[subject] ?? subject;
  return {
    title: `High School ${label} | Illustrate.live`,
    description: `High School ${label} chapters and topics.`,
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
        <h1 className="text-5xl font-bold tracking-tight text-white">High School {label}</h1>
        <p className="mt-4 text-lg text-neutral-400">
          {isPhysics
            ? "Choose a chapter to explore interactive simulations."
            : "Chapters and topics. Content coming soon."}
        </p>

        {isPhysics && (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {physicsChapters.map((chapter) => (
              <Link
                key={chapter.href}
                href={chapter.href}
                className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:bg-neutral-900"
              >
                <h2 className="text-xl font-semibold text-white">{chapter.title}</h2>
                <p className="mt-2 text-sm text-neutral-400">{chapter.description}</p>
                <span className="mt-4 inline-flex rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
                  Open chapter
                </span>
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/"
          className="mt-10 inline-block rounded-xl border border-neutral-600 px-6 py-3 text-neutral-300 transition hover:bg-neutral-800"
        >
          Back to Illustrate
        </Link>
      </section>
    </main>
  );
}
