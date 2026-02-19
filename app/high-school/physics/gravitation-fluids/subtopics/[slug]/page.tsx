import { notFound } from "next/navigation";
import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import {
  GRAVITATION_FLUIDS_SUBTOPICS,
  GRAVITATION_FLUIDS_SUBTOPIC_SLUGS,
  type GravitationFluidsSubtopicSlug,
} from "@/lib/data/gravitation-fluids-subtopics";
import { SITE_URL } from "@/lib/seo";
import GravitationFluidsSubtopicSimulator from "@/components/simulations/physics/GravitationFluidsSubtopicSimulator";
import SubtopicTheorySection from "@/app/components/SubtopicTheorySection";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return GRAVITATION_FLUIDS_SUBTOPIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const subtopic = GRAVITATION_FLUIDS_SUBTOPICS[slug as GravitationFluidsSubtopicSlug];
  if (!subtopic) return { title: "Subtopic | Gravitation and Fluids" };
  return {
    title: `${subtopic.title} | Gravitation and Fluids | High School Physics`,
    description: subtopic.shortDescription,
    keywords: subtopic.keywords,
    alternates: {
      canonical: `${SITE_URL}/high-school/physics/gravitation-fluids/subtopics/${subtopic.slug}`,
    },
    openGraph: {
      title: `${subtopic.title} | Gravitation and Fluids`,
      description: subtopic.shortDescription,
      url: `${SITE_URL}/high-school/physics/gravitation-fluids/subtopics/${subtopic.slug}`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function GravitationFluidsSubtopicPage({ params }: Props) {
  const { slug } = await params;
  const subtopic = GRAVITATION_FLUIDS_SUBTOPICS[slug as GravitationFluidsSubtopicSlug];
  if (!subtopic) notFound();

  const breadcrumbs = [
    { label: "Gravitation and Fluids", href: "/high-school/physics/gravitation-fluids" },
    { label: subtopic.title, href: `/high-school/physics/gravitation-fluids/subtopics/${subtopic.slug}` },
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
          <GravitationFluidsSubtopicSimulator slug={slug as GravitationFluidsSubtopicSlug} />
        </div>
      </section>

      <SubtopicTheorySection
        content={subtopic.content}
        reflectivePrompt={subtopic.reflectivePrompt}
        simulatorCallout={subtopic.simulatorCallout}
      />

      <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-wrap gap-4">
        <Link
          href="/high-school/physics/gravitation-fluids"
          className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
        >
          ← Back to Gravitation and Fluids simulator
        </Link>
        <Link
          href="/high-school/physics/gravitation-fluids#subtopics"
          className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition"
        >
          View all subtopics
        </Link>
      </div>
    </SeniorSecondaryTopicLayout>
  );
}
