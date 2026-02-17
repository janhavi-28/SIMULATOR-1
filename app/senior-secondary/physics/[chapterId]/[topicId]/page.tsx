import { notFound } from "next/navigation";
import { slugToTitle } from "@/lib/data/slugToTitle";
import LazyPhysicsSimulationLoader from "@/components/LazyPhysicsSimulationLoader";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import ComingSoonBlock from "@/components/topics/ComingSoonBlock";
import { SimulationJsonLd } from "@/components/JsonLd";
import { physicsChapters, physicsTopicsByChapter } from "@/lib/data/senior-secondary-physics";
import { SENIOR_SECONDARY_PHYSICS_SIMS } from "@/lib/data/simulation-mapping";
import { physicsTopicMeta } from "@/lib/registries/physics";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ chapterId: string; topicId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { chapterId, topicId } = await params;
  const title = slugToTitle(topicId);
  const chapter = physicsChapters.find((c) => c.id === chapterId);
  const meta = physicsTopicMeta[topicId];

  const description = meta?.description ?? `Interactive simulation and explanation for ${title} in Senior Secondary Physics.`;
  const canonical = `${SITE_URL}/senior-secondary/physics/${chapterId}/${topicId}`;
  const keywords = meta?.keywords
    ? [...meta.keywords, "senior secondary physics", "Class 11", "Class 12", "physics simulation"]
    : ["senior secondary physics", "physics simulation", "kinematics", "illustrate.live"];

  return {
    title: `${title} | Senior Secondary Physics`,
    description,
    keywords: keywords.join(", "),
    alternates: { canonical },
    openGraph: {
      title: `${title} | Senior Secondary Physics | Illustrate.live`,
      description,
      url: canonical,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function SeniorSecondaryPhysicsTopicPage({ params }: PageProps) {
  const { chapterId, topicId } = await params;
  const chapter = physicsChapters.find((c) => c.id === chapterId);
  if (!chapter) notFound();

  const topics = physicsTopicsByChapter[chapter.id] ?? [];
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) notFound();

  const base = `/senior-secondary/physics/${chapterId}`;
  const breadcrumbs = [
    { label: chapter.title, href: base },
    { label: topic.title, href: `${base}/${topicId}` },
  ];

  const hasSimulation = (SENIOR_SECONDARY_PHYSICS_SIMS as readonly string[]).includes(
    topicId
  );

  const meta = physicsTopicMeta[topicId];
  const canonicalUrl = `${SITE_URL}/senior-secondary/physics/${chapterId}/${topicId}`;

  return (
    <>
      {hasSimulation && meta && (
        <SimulationJsonLd
          name={topic.title}
          description={meta.description}
          url={canonicalUrl}
          keywords={meta.keywords}
        />
      )}
      <SeniorSecondaryTopicLayout
        level="senior-secondary"
        subject="physics"
        breadcrumbs={breadcrumbs}
        title={topic.title}
        fullWidth={hasSimulation}
      >
        {hasSimulation ? (
          <div className="mt-2">
            {meta && (
              <p className="mb-4 text-sm text-neutral-300 max-w-3xl">
                {meta.description} Use the simulation below to explore this concept interactively.
              </p>
            )}
            <LazyPhysicsSimulationLoader topic={topicId} />
          </div>
        ) : (
          <ComingSoonBlock topicTitle={topic.title} />
        )}
      </SeniorSecondaryTopicLayout>
    </>
  );
}
