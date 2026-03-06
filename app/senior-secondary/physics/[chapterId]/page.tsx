import { notFound } from "next/navigation";
import Link from "next/link";
import { physicsChapters, physicsTopicsByChapter } from "@/lib/data/senior-secondary-physics";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import PhysicalWorldMeasurementChapterContent from "@/app/components/PhysicalWorldMeasurementChapterContent";
import WorkEnergyTheoremAccordion from "@/app/components/WorkEnergyTheoremAccordion";
import { SENIOR_SECONDARY_PHYSICS_SIMS } from "@/lib/data/simulation-mapping";

const liveSims = new Set<string>(SENIOR_SECONDARY_PHYSICS_SIMS);

type ChapterPageProps = {
  params: Promise<{ chapterId: string }>;
};

export async function generateMetadata({ params }: ChapterPageProps) {
  const { chapterId } = await params;
  const chapter = physicsChapters.find((c) => c.id === chapterId);
  if (!chapter) return { title: "Chapter not found" };
  return {
    title: `Senior Secondary Physics - ${chapter.title} | Illustrate.live`,
    description: `Topics for ${chapter.title} in Senior Secondary Physics.`,
  };
}

export default async function SeniorSecondaryPhysicsChapterPage({
  params,
}: ChapterPageProps) {
  const { chapterId } = await params;
  const chapter = physicsChapters.find((c) => c.id === chapterId);
  if (!chapter) notFound();

  const topics = physicsTopicsByChapter[chapter.id] ?? [];
  const base = "/senior-secondary/physics";
  const breadcrumbs = [{ label: chapter.title, href: `${base}/${chapter.id}` }];

  return (
    <SeniorSecondaryTopicLayout
      level="senior-secondary"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title={chapter.title}
    >
      {chapter.id === "physical-world-and-measurement" && (
        <div className="mb-8">
          <PhysicalWorldMeasurementChapterContent />
        </div>
      )}

      {topics.length === 0 ? (
        <p className="text-sm text-neutral-400">
          Topics for this chapter will be added soon.
        </p>
      ) : (
        <div className="mt-4">
          {chapter.id === "work-energy-and-power" && (
            <>
              <h2 className="mb-3 text-sm font-semibold text-neutral-200">
                Topics in this chapter
              </h2>
              <WorkEnergyTheoremAccordion />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {topics
                  .filter((t) => t.id !== "work-energy-theorem")
                  .map((topic) => {
                    const isLive = liveSims.has(topic.id);
                    return (
                      <Link
                        key={topic.id}
                        href={`${base}/${chapter.id}/${topic.id}`}
                        className={`group rounded-2xl border bg-neutral-950/80 p-4 transition ${isLive ? "border-neutral-800 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:bg-neutral-900" : "border-neutral-800/50 opacity-60 cursor-default pointer-events-none"}`}
                      >
                        <div className="text-sm font-semibold text-white">
                          {topic.title}
                        </div>
                        <p className="mt-2 text-xs text-neutral-400">
                          {isLive ? "Open topic · live simulation" : "Coming soon"}
                        </p>
                      </Link>
                    );
                  })}
              </div>
            </>
          )}
          {chapter.id !== "work-energy-and-power" && (
            <>
              <h2 className="mb-3 text-sm font-semibold text-neutral-200">
                Topics in this chapter
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {topics.map((topic) => {
                  const isLive = liveSims.has(topic.id);
                  return (
                    <Link
                      key={topic.id}
                      href={`${base}/${chapter.id}/${topic.id}`}
                      className={`group rounded-2xl border bg-neutral-950/80 p-4 transition ${isLive ? "border-neutral-800 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:bg-neutral-900" : "border-neutral-800/50 opacity-60 cursor-default pointer-events-none"}`}
                    >
                      <div className="text-sm font-semibold text-white">
                        {topic.title}
                      </div>
                      <p className="mt-2 text-xs text-neutral-400">
                        {isLive ? "Open topic · live simulation" : "Coming soon"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </SeniorSecondaryTopicLayout>
  );
}


