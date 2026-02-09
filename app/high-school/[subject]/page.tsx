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

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />
      <section className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          High School {label}
        </h1>
        <p className="mt-4 text-lg text-neutral-400">
          Chapters and topics. Content coming soon.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl border border-neutral-600 px-6 py-3 text-neutral-300 hover:bg-neutral-800 transition"
        >
          ← Back to Illustrate
        </Link>
      </section>
    </main>
  );
}
