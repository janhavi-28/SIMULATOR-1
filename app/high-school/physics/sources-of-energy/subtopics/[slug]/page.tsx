import { notFound } from "next/navigation";
import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import {
  SOURCES_OF_ENERGY_SUBTOPICS,
  SOURCES_OF_ENERGY_SUBTOPIC_SLUGS,
  type SourcesOfEnergySubtopicSlug,
} from "@/lib/data/sources-of-energy-subtopics";
import { SITE_URL } from "@/lib/seo";
import SourcesOfEnergySubtopicSimulator from "@/components/simulations/physics/SourcesOfEnergySubtopicSimulator";
import SubtopicTheorySection from "@/app/components/SubtopicTheorySection";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return SOURCES_OF_ENERGY_SUBTOPIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const subtopic = SOURCES_OF_ENERGY_SUBTOPICS[slug as SourcesOfEnergySubtopicSlug];
  if (!subtopic) return { title: "Subtopic | Sources of Energy" };
  return {
    title: `${subtopic.title} | Sources of Energy | High School Physics`,
    description: subtopic.shortDescription,
    keywords: subtopic.keywords,
    alternates: {
      canonical: `${SITE_URL}/high-school/physics/sources-of-energy/subtopics/${subtopic.slug}`,
    },
    openGraph: {
      title: `${subtopic.title} | Sources of Energy`,
      description: subtopic.shortDescription,
      url: `${SITE_URL}/high-school/physics/sources-of-energy/subtopics/${subtopic.slug}`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function SourcesOfEnergySubtopicPage({ params }: Props) {
  const { slug } = await params;
  const subtopic = SOURCES_OF_ENERGY_SUBTOPICS[slug as SourcesOfEnergySubtopicSlug];
  if (!subtopic) notFound();

  const breadcrumbs = [
    { label: "Sources of Energy", href: "/high-school/physics/sources-of-energy" },
    {
      label: subtopic.title,
      href: `/high-school/physics/sources-of-energy/subtopics/${subtopic.slug}`,
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

        <section className={`mb-8 w-full ${slug === "wind-energy" ? "simulator-section-full-width" : ""}`}>
          <h2 className="text-lg font-semibold text-white mb-3">Try the simulator</h2>
          <SourcesOfEnergySubtopicSimulator slug={slug as SourcesOfEnergySubtopicSlug} />
        </section>

        <SubtopicTheorySection
          content={subtopic.content}
          reflectivePrompt={subtopic.reflectivePrompt}
          simulatorCallout={subtopic.simulatorCallout}
        />

        <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-wrap gap-4">
          <Link
            href="/high-school/physics/sources-of-energy"
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20 transition"
          >
            ← Back to Sources of Energy
          </Link>
          <Link
            href="/high-school/physics/sources-of-energy#subtopics"
            className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition"
          >
            View all subtopics
          </Link>
        </div>
      </div>
    </SeniorSecondaryTopicLayout>
  );
}

