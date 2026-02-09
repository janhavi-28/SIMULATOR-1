import { notFound } from "next/navigation";
import Link from "next/link";
import { chemistry11Chapters } from "@/app/subjects/class-11/data";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";

type ChapterPageProps = {
  params: Promise<{ chapterId: string }>;
};

export async function generateMetadata({ params }: ChapterPageProps) {
  const { chapterId } = await params;
  const chapter = chemistry11Chapters.find((c) => c.id === chapterId);
  if (!chapter) return { title: "Chapter not found" };
  return {
    title: `Senior Secondary Chemistry – ${chapter.title} | Illustrate.live`,
    description: `Topics and subtopics for ${chapter.title} in Senior Secondary Chemistry.`,
  };
}

export default async function SeniorSecondaryChemistryChapterPage({
  params,
}: ChapterPageProps) {
  const { chapterId } = await params;
  const chapter = chemistry11Chapters.find((c) => c.id === chapterId);
  if (!chapter) notFound();

  const base = "/senior-secondary/chemistry";
  const breadcrumbs = [{ label: chapter.title, href: `${base}/${chapter.id}` }];

  return (
    <SeniorSecondaryTopicLayout
      level="senior-secondary"
      subject="chemistry"
      breadcrumbs={breadcrumbs}
      title={chapter.title}
      subtitle={`${chapter.part} chemistry`}
    >
      {chapter.topics.length === 0 ? (
        <p className="text-sm text-neutral-400">Topics for this chapter will be added soon.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {chapter.topics.map((topic) => (
            <Link
              key={topic.id}
              href={`${base}/${chapter.id}/${topic.id}`}
              className="group rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 transition hover:-translate-y-0.5 hover:border-emerald-500/60 hover:bg-neutral-900"
            >
              <div className="text-sm font-semibold text-white">{topic.title}</div>
              <p className="mt-2 text-xs text-neutral-400">
                Open topic · {topic.subtopics.length} subtopic{topic.subtopics.length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </SeniorSecondaryTopicLayout>
  );
}
