import { notFound } from "next/navigation";
import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import {
  WORK_ENERGY_POWER_SUBTOPICS,
  WORK_ENERGY_POWER_SUBTOPIC_SLUGS,
  type WorkEnergyPowerSubtopicSlug,
} from "@/lib/data/work-energy-power-subtopics";
import { SITE_URL } from "@/lib/seo";
import WorkEnergyPowerSubtopicSimulator from "@/components/simulations/physics/WorkEnergyPowerSubtopicSimulator";
import SubtopicTheorySection from "@/app/components/SubtopicTheorySection";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return WORK_ENERGY_POWER_SUBTOPIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const subtopic = WORK_ENERGY_POWER_SUBTOPICS[slug as WorkEnergyPowerSubtopicSlug];
  if (!subtopic) return { title: "Subtopic | Work, Energy & Power" };
  return {
    title: `${subtopic.title} | Work, Energy & Power | High School Physics`,
    description: subtopic.shortDescription,
    keywords: subtopic.keywords,
    alternates: {
      canonical: `${SITE_URL}/high-school/physics/work-energy-power/subtopics/${subtopic.slug}`,
    },
    openGraph: {
      title: `${subtopic.title} | Work, Energy & Power`,
      description: subtopic.shortDescription,
      url: `${SITE_URL}/high-school/physics/work-energy-power/subtopics/${subtopic.slug}`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function WorkEnergyPowerSubtopicPage({ params }: Props) {
  const { slug } = await params;
  const subtopic = WORK_ENERGY_POWER_SUBTOPICS[slug as WorkEnergyPowerSubtopicSlug];
  if (!subtopic) notFound();

  const breadcrumbs = [
    { label: "Work, Energy & Power", href: "/high-school/physics/work-energy-power" },
    { label: subtopic.title, href: `/high-school/physics/work-energy-power/subtopics/${subtopic.slug}` },
  ];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title={subtopic.title}
    >
      <p className="mb-6 text-base text-neutral-300 max-w-3xl leading-relaxed">
        {subtopic.shortDescription}
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-3">Try the simulator</h2>
        <div
          className="flex flex-col flex-1 min-h-0 rounded-2xl border border-neutral-700 bg-neutral-950/80 overflow-auto shadow-lg shadow-black/20 w-full"
          style={{ minHeight: "420px", height: "min(calc(100vh - 20rem), 560px)" }}
        >
          <WorkEnergyPowerSubtopicSimulator slug={slug as WorkEnergyPowerSubtopicSlug} />
        </div>
      </section>

      <SubtopicTheorySection
        content={subtopic.content}
        reflectivePrompt={subtopic.reflectivePrompt}
        simulatorCallout={subtopic.simulatorCallout}
      />

      <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-wrap gap-4">
        <Link
          href="/high-school/physics/work-energy-power"
          className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
        >
          ← Back to Work, Energy & Power simulator
        </Link>
        <Link
          href="/high-school/physics/work-energy-power#subtopics"
          className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition"
        >
          View all subtopics
        </Link>
      </div>
    </SeniorSecondaryTopicLayout>
  );
}
