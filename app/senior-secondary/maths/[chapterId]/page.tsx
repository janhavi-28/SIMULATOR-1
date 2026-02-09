import { notFound } from "next/navigation";
import Link from "next/link";
import { mathsChapters } from "@/app/subjects/class-11/maths/chapters-data";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";

type ChapterPageProps = {
  params: Promise<{ chapterId: string }>;
};

export async function generateMetadata({ params }: ChapterPageProps) {
  const { chapterId } = await params;
  const chapter = mathsChapters.find((c) => c.id === chapterId);
  if (!chapter) return { title: "Chapter not found" };
  return {
    title: `Senior Secondary Mathematics – ${chapter.title} | Illustrate.live`,
    description: `Topics for ${chapter.title} in Senior Secondary Mathematics.`,
  };
}

export default async function SeniorSecondaryMathsChapterPage({
  params,
}: ChapterPageProps) {
  const { chapterId } = await params;
  const chapter = mathsChapters.find((c) => c.id === chapterId);
  if (!chapter) notFound();

  const base = "/senior-secondary/maths";
  const breadcrumbs = [{ label: chapter.title, href: `${base}/${chapter.id}` }];

  return (
    <SeniorSecondaryTopicLayout
      level="senior-secondary"
      subject="maths"
      breadcrumbs={breadcrumbs}
      title={chapter.title}
    >
      <p className="text-sm text-neutral-400">
        Topics for this chapter will be added soon.
      </p>
      <Link
        href={base}
        className="mt-6 inline-block text-sm text-neutral-400 hover:text-white transition"
      >
        ← Back to chapters
      </Link>
    </SeniorSecondaryTopicLayout>
  );
}
