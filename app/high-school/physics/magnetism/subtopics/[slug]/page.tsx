import { notFound } from "next/navigation";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import {
  MAGNETISM_SUBTOPICS,
  MAGNETISM_SUBTOPIC_SLUGS,
  type MagnetismSubtopicSlug,
} from "@/lib/data/magnetism-subtopics";
import { SITE_URL } from "@/lib/seo";
import MagnetismSubtopicSimulator from "@/components/simulations/physics/MagnetismSubtopicSimulator";
import SubtopicTheorySection from "@/app/components/SubtopicTheorySection";
import ElectricGeneratorTopicPage from "../../components/ElectricGeneratorTopicPage";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return MAGNETISM_SUBTOPIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const subtopic = MAGNETISM_SUBTOPICS[slug as MagnetismSubtopicSlug];
  if (!subtopic) return { title: "Subtopic | Magnetism & Electromagnetism" };
  return {
    title: `${subtopic.title} | Magnetism & Electromagnetism | High School Physics`,
    description: subtopic.shortDescription,
    keywords: subtopic.keywords,
    alternates: {
      canonical: `${SITE_URL}/high-school/physics/magnetism/subtopics/${subtopic.slug}`,
    },
    openGraph: {
      title: `${subtopic.title} | Magnetism & Electromagnetism`,
      description: subtopic.shortDescription,
      url: `${SITE_URL}/high-school/physics/magnetism/subtopics/${subtopic.slug}`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function MagnetismSubtopicPage({ params }: Props) {
  const { slug } = await params;
  const subtopic = MAGNETISM_SUBTOPICS[slug as MagnetismSubtopicSlug];
  if (!subtopic) notFound();

  const breadcrumbs = [
    { label: "Magnetism & Electromagnetism", href: "/high-school/physics/magnetism" },
    {
      label: subtopic.title,
      href: `/high-school/physics/magnetism/subtopics/${subtopic.slug}`,
    },
  ];

  const isElectricGenerator = slug === "electric-generator";
  const isMagneticField = slug === "magnetic-field";

  if (isElectricGenerator) {
    return (
      <SeniorSecondaryTopicLayout
        level="high-school"
        subject="physics"
        breadcrumbs={breadcrumbs}
        title={subtopic.title}
        subtitle="Mechanical Rotation → Changing Flux → Induced EMF"
        fullWidth
        contentClassName="mt-12"
      >
        <ElectricGeneratorTopicPage />
      </SeniorSecondaryTopicLayout>
    );
  }

  if (isMagneticField) {
    return (
      <SeniorSecondaryTopicLayout
        level="high-school"
        subject="physics"
        breadcrumbs={breadcrumbs}
        title={subtopic.title}
        subtitle="Direction N → S · Stronger near poles · Weaker with distance."
        fullWidth
        contentClassName="mt-8"
      >
        <div className="sim-topic-container px-6">
          <p className="mb-4 text-sm text-neutral-400">{subtopic.shortDescription}</p>
          <section className="mb-8 w-full">
            <MagnetismSubtopicSimulator slug={slug as MagnetismSubtopicSlug} />
          </section>
          <SubtopicTheorySection
            content={subtopic.content}
            reflectivePrompt={subtopic.reflectivePrompt}
            simulatorCallout={subtopic.simulatorCallout}
          />
          <div className="mt-8 flex flex-wrap gap-4 border-t border-neutral-700 pt-6">
            <Link
              href="/high-school/physics/magnetism"
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20"
            >
              ← Back to Magnetism &amp; Electromagnetism
            </Link>
            <Link
              href="/high-school/physics/magnetism#subtopics"
              className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-neutral-700"
            >
              View all subtopics
            </Link>
          </div>
        </div>
      </SeniorSecondaryTopicLayout>
    );
  }

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
          <MagnetismSubtopicSimulator slug={slug as MagnetismSubtopicSlug} />
        </section>

        <SubtopicTheorySection
          content={subtopic.content}
          reflectivePrompt={subtopic.reflectivePrompt}
          simulatorCallout={subtopic.simulatorCallout}
        />

        <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-wrap gap-4">
          <Link
            href="/high-school/physics/magnetism"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
          >
            ← Back to Magnetism &amp; Electromagnetism
          </Link>
          <Link
            href="/high-school/physics/magnetism#subtopics"
            className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition"
          >
            View all subtopics
          </Link>
        </div>
      </div>
    </SeniorSecondaryTopicLayout>
  );
}

