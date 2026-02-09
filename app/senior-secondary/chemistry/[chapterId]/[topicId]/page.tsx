import Link from "next/link";
import { notFound } from "next/navigation";
import { chemistry11Chapters } from "@/app/subjects/class-11/data";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";

export const dynamic = "force-dynamic";

type TopicPageProps = {
  params: Promise<{ chapterId: string; topicId: string }>;
};

export async function generateMetadata({ params }: TopicPageProps) {
  const { chapterId, topicId } = await params;
  const chapter = chemistry11Chapters.find((c) => c.id === chapterId);
  const topic = chapter?.topics.find((t) => t.id === topicId);
  if (!chapter || !topic) return { title: "Topic not found" };
  return {
    title: `Senior Secondary Chemistry – ${topic.title} | Illustrate.live`,
    description: `Explanation and subtopic list for ${topic.title} in ${chapter.title}.`,
  };
}

export default async function SeniorSecondaryChemistryTopicPage({
  params,
}: TopicPageProps) {
  const { chapterId, topicId } = await params;
  const chapter = chemistry11Chapters.find((c) => c.id === chapterId);
  const topic = chapter?.topics.find((t) => t.id === topicId);
  if (!chapter || !topic) notFound();

  const breadcrumbs = [
    { label: chapter.title, href: `/senior-secondary/chemistry/${chapterId}` },
    { label: topic.title, href: `/senior-secondary/chemistry/${chapterId}/${topicId}` },
  ];

  return (
    <SeniorSecondaryTopicLayout
      level="senior-secondary"
      subject="chemistry"
      breadcrumbs={breadcrumbs}
      title={topic.title}
      subtitle={
        <>
          Chapter: <span className="font-medium text-neutral-100">{chapter.title}</span>
        </>
      }
    >
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6">
        <h2 className="text-sm font-semibold text-white">Subtopics in this concept</h2>
        {topic.subtopics.length > 0 ? (
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-300">
            {topic.subtopics.map((sub) => (
              <li key={sub.id} className="flex items-start gap-2">
                <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <Link
                  href={`/senior-secondary/chemistry/${chapterId}/${topicId}/${sub.id}`}
                  className="text-emerald-200 hover:text-emerald-100 underline decoration-emerald-500/60 underline-offset-2"
                >
                  {sub.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-neutral-400">
            Detailed subtopics for this concept will be added soon.
          </p>
        )}
      </div>
    </SeniorSecondaryTopicLayout>
  );
}
