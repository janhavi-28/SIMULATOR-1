import { notFound } from "next/navigation";
import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import {
  MATTER_DENSITY_STATES_SUBTOPICS,
  MATTER_DENSITY_STATES_SUBTOPIC_SLUGS,
  type MatterDensityStatesSubtopicSlug,
} from "@/lib/data/matter-density-states-subtopics";
import { SITE_URL } from "@/lib/seo";
import MatterDensityStatesSubtopicSimulator from "@/components/simulations/physics/MatterDensityStatesSubtopicSimulator";
import SubtopicTheorySection from "@/app/components/SubtopicTheorySection";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return MATTER_DENSITY_STATES_SUBTOPIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const subtopic = MATTER_DENSITY_STATES_SUBTOPICS[slug as MatterDensityStatesSubtopicSlug];
  if (!subtopic) return { title: "Subtopic | Matter, Density & States" };
  return {
    title: `${subtopic.title} | Matter, Density & States | High School Physics`,
    description: subtopic.shortDescription,
    keywords: subtopic.keywords,
    alternates: {
      canonical: `${SITE_URL}/high-school/physics/matter-density-states/subtopics/${subtopic.slug}`,
    },
    openGraph: {
      title: `${subtopic.title} | Matter, Density & States`,
      description: subtopic.shortDescription,
      url: `${SITE_URL}/high-school/physics/matter-density-states/subtopics/${subtopic.slug}`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function MatterDensityStatesSubtopicPage({ params }: Props) {
  const { slug } = await params;
  const subtopic = MATTER_DENSITY_STATES_SUBTOPICS[slug as MatterDensityStatesSubtopicSlug];
  if (!subtopic) notFound();

  const breadcrumbs = [
    { label: "Matter, Density & States", href: "/high-school/physics/matter-density-states" },
    {
      label: subtopic.title,
      href: `/high-school/physics/matter-density-states/subtopics/${subtopic.slug}`,
    },
  ];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title={subtopic.title}
      fullWidth
      contentClassName="mt-8"
    >
      <div className="sim-topic-container">
        <p className="mb-6 text-base text-neutral-300 max-w-3xl leading-relaxed">
          {subtopic.shortDescription}
        </p>

        <section className="mb-8 w-full">
          <h2 className="text-lg font-semibold text-white mb-3">Try the simulator</h2>
          <MatterDensityStatesSubtopicSimulator slug={slug as MatterDensityStatesSubtopicSlug} />
        </section>

        <SubtopicTheorySection
          content={subtopic.content}
          reflectivePrompt={subtopic.reflectivePrompt}
          simulatorCallout={subtopic.simulatorCallout}
        />

        <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-wrap gap-4">
          <Link
            href="/high-school/physics/matter-density-states"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
          >
            ← Back to Matter, Density &amp; States
          </Link>
          <Link
            href="/high-school/physics/matter-density-states#subtopics"
            className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition"
          >
            View all subtopics
          </Link>
        </div>
      </div>
    </SeniorSecondaryTopicLayout>
  );
}

