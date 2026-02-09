import { notFound } from "next/navigation";
import { chemistry11Chapters } from "@/app/subjects/class-11/data";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import ComingSoonBlock from "@/components/topics/ComingSoonBlock";

export const dynamic = "force-dynamic";

type SubtopicPageProps = {
  params: Promise<{ chapterId: string; topicId: string; subtopicId: string }>;
};

export async function generateMetadata({ params }: SubtopicPageProps) {
  const { chapterId, topicId, subtopicId } = await params;
  const chapter = chemistry11Chapters.find((c) => c.id === chapterId);
  const topic = chapter?.topics.find((t) => t.id === topicId);
  const subtopic = topic?.subtopics.find((s) => s.id === subtopicId);
  if (!chapter || !topic || !subtopic) return { title: "Subtopic not found" };
  return {
    title: `Senior Secondary Chemistry – ${subtopic.title} | Illustrate.live`,
    description: `Explanation and illustration for ${subtopic.title} in ${chapter.title} (${topic.title}).`,
  };
}

export default async function SeniorSecondaryChemistrySubtopicPage({
  params,
}: SubtopicPageProps) {
  const { chapterId, topicId, subtopicId } = await params;
  const chapter = chemistry11Chapters.find((c) => c.id === chapterId);
  const topic = chapter?.topics.find((t) => t.id === topicId);
  const subtopic = topic?.subtopics.find((s) => s.id === subtopicId);
  if (!chapter || !topic || !subtopic) notFound();

  const breadcrumbs = [
    { label: chapter.title, href: `/senior-secondary/chemistry/${chapterId}` },
    { label: topic.title, href: `/senior-secondary/chemistry/${chapterId}/${topicId}` },
    { label: subtopic.title, href: `/senior-secondary/chemistry/${chapterId}/${topicId}/${subtopicId}` },
  ];

  return (
    <SeniorSecondaryTopicLayout
      level="senior-secondary"
      subject="chemistry"
      breadcrumbs={breadcrumbs}
      title={subtopic.title}
      subtitle={
        <>
          Chapter: <span className="font-medium text-neutral-100">{chapter.title}</span>
          <br />
          Topic: <span className="font-medium text-neutral-100">{topic.title}</span>
        </>
      }
    >
      <ComingSoonBlock topicTitle={subtopic.title} />
    </SeniorSecondaryTopicLayout>
  );
}
