import Link from "next/link";

export type BreadcrumbItem = { label: string; href: string };

type TopicPageContentProps = {
  /** Class e.g. "class-11" */
  classSlug: string;
  /** Subject e.g. "chemistry" */
  subject: string;
  /** Segment labels for breadcrumb (e.g. chapter title, topic title, subtopic title) */
  breadcrumbs: BreadcrumbItem[];
  /** Main page title (h1) */
  title: string;
  /** Optional subtitle or context line */
  subtitle?: React.ReactNode;
  /** Optional "part" label e.g. "Physical chemistry" */
  part?: string;
  /** When true, content area uses full width (e.g. for simulators) */
  fullWidth?: boolean;
  /** Page content: coming soon box or custom content */
  children: React.ReactNode;
};

export default function TopicPageContent({
  classSlug,
  subject,
  breadcrumbs,
  title,
  subtitle,
  part,
  fullWidth,
  children,
}: TopicPageContentProps) {
  const base = `/subjects/${classSlug}/${subject}`;
  const subjectLabel =
    subject === "physics"
      ? "Physics"
      : subject === "chemistry"
        ? "Chemistry"
        : subject === "biology"
          ? "Biology"
          : subject === "maths"
            ? "Mathematics"
            : subject;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />
      <section
        className={
          fullWidth
            ? "mx-auto w-full min-w-0 px-4 pt-28 pb-24 sm:px-6 lg:px-8"
            : "mx-auto max-w-4xl px-6 pt-28 pb-24"
        }
      >
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm">
          <Link
            href={`/subjects/${classSlug}`}
            className="text-neutral-400 transition hover:text-white"
          >
            {classSlug === "class-9" ? "Class 9" : classSlug === "class-10" ? "Class 10" : classSlug === "class-11" ? "Class 11" : classSlug === "class-12" ? "Class 12" : classSlug}
          </Link>
          {breadcrumbs.map((item, i) => (
            <span key={item.href}>
              <span className="text-neutral-600">/</span>
              {i === breadcrumbs.length - 1 ? (
                <span className="text-white">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="text-neutral-400 transition hover:text-white"
                >
                  {item.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {part && (
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
            {classSlug.replace("-", " ")} · {subjectLabel} · {part}
          </p>
        )}
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
        )}

        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
