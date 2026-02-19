import { notFound } from "next/navigation";
import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import {
  LIGHT_OPTICS_SUBTOPICS,
  LIGHT_OPTICS_SUBTOPIC_SLUGS,
  type SubtopicSlug,
} from "@/lib/data/light-optics-subtopics";
import { SITE_URL } from "@/lib/seo";
import LightOpticsSubtopicSimulator from "@/components/simulations/physics/LightOpticsSubtopicSimulator";
import SubtopicTheorySection from "@/app/components/SubtopicTheorySection";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return LIGHT_OPTICS_SUBTOPIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const subtopic = LIGHT_OPTICS_SUBTOPICS[slug as SubtopicSlug];
  if (!subtopic) return { title: "Subtopic | Light and Optics" };
  return {
    title: `${subtopic.title} | Light and Optics | High School Physics`,
    description: subtopic.shortDescription,
    keywords: subtopic.keywords,
    alternates: {
      canonical: `${SITE_URL}/high-school/physics/light/subtopics/${subtopic.slug}`,
    },
    openGraph: {
      title: `${subtopic.title} | Light and Optics`,
      description: subtopic.shortDescription,
      url: `${SITE_URL}/high-school/physics/light/subtopics/${subtopic.slug}`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function LightOpticsSubtopicPage({ params }: Props) {
  const { slug } = await params;
  const subtopic = LIGHT_OPTICS_SUBTOPICS[slug as SubtopicSlug];
  if (!subtopic) notFound();

  const breadcrumbs = [
    { label: "Light and Optics", href: "/high-school/physics/light" },
    { label: subtopic.title, href: `/high-school/physics/light/subtopics/${subtopic.slug}` },
  ];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title={subtopic.title}
      fullWidth
      contentClassName="mt-4"
    >
      <div className="sim-topic-container">
        <p className="mb-4 text-base text-neutral-300 max-w-3xl leading-relaxed">
          {subtopic.shortDescription}
        </p>

        <section className="mb-8 w-full sim-full-bleed">
          <h2 className="text-lg font-semibold text-white mb-0 px-4 sm:px-6 lg:px-8">Try the simulator</h2>
          <div className="h-[90vh] min-h-[560px] w-full flex flex-col px-4 sm:px-6 lg:px-8 mt-1 [&>*]:flex-1 [&>*]:min-h-0">
            <LightOpticsSubtopicSimulator slug={slug as SubtopicSlug} />
          </div>
        </section>

        <SubtopicTheorySection
          content={subtopic.content}
          reflectivePrompt={subtopic.reflectivePrompt}
          simulatorCallout={subtopic.simulatorCallout}
        />

        <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-wrap gap-4">
          <Link
            href="/high-school/physics/light"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
          >
            ← Back to Light and Optics simulator
          </Link>
          <Link
            href="/high-school/physics/light#subtopics"
            className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition"
          >
            View all subtopics
          </Link>
        </div>
      </div>
    </SeniorSecondaryTopicLayout>
  );
}
