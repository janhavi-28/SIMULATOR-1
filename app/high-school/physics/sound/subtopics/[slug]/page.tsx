import { notFound } from "next/navigation";
import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import {
  SOUND_SUBTOPICS,
  SOUND_SUBTOPIC_SLUGS,
  type SoundSubtopicSlug,
} from "@/lib/data/sound-subtopics";
import { SITE_URL } from "@/lib/seo";
import SoundSubtopicSimulator from "@/components/simulations/physics/SoundSubtopicSimulator";
import SubtopicTheorySection from "@/app/components/SubtopicTheorySection";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return SOUND_SUBTOPIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const subtopic = SOUND_SUBTOPICS[slug as SoundSubtopicSlug];
  if (!subtopic) return { title: "Subtopic | Sound" };
  return {
    title: `${subtopic.title} | Sound | High School Physics`,
    description: subtopic.shortDescription,
    keywords: subtopic.keywords,
    alternates: {
      canonical: `${SITE_URL}/high-school/physics/sound/subtopics/${subtopic.slug}`,
    },
    openGraph: {
      title: `${subtopic.title} | Sound`,
      description: subtopic.shortDescription,
      url: `${SITE_URL}/high-school/physics/sound/subtopics/${subtopic.slug}`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function SoundSubtopicPage({ params }: Props) {
  const { slug } = await params;
  const subtopic = SOUND_SUBTOPICS[slug as SoundSubtopicSlug];
  if (!subtopic) notFound();

  const breadcrumbs = [
    { label: "Sound", href: "/high-school/physics/sound" },
    { label: subtopic.title, href: `/high-school/physics/sound/subtopics/${subtopic.slug}` },
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
          <SoundSubtopicSimulator slug={slug as SoundSubtopicSlug} />
        </section>

        <SubtopicTheorySection
          content={subtopic.content}
          reflectivePrompt={subtopic.reflectivePrompt}
          simulatorCallout={subtopic.simulatorCallout}
        />

        <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-wrap gap-4">
          <Link
            href="/high-school/physics/sound"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
          >
            ← Back to Sound
          </Link>
          <Link
            href="/high-school/physics/sound#subtopics"
            className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition"
          >
            View all subtopics
          </Link>
        </div>
      </div>
    </SeniorSecondaryTopicLayout>
  );
}
