import Link from "next/link";

type BreadcrumbItem = { label: string; href: string };

type Props = {
  level: "senior-secondary" | "high-school";
  subject: string;
  breadcrumbs: BreadcrumbItem[];
  title: string;
  titleClassName?: string;
  contentClassName?: string;
  subtitle?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
};

const subjectLabels: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  maths: "Mathematics",
};

export default function SeniorSecondaryTopicLayout({
  level,
  subject,
  breadcrumbs,
  title,
  subtitle,
  fullWidth,
  children,
}: Props) {
  const base = `/${level}/${subject}`;
  const levelLabel = level === "senior-secondary" ? "Senior Secondary" : "High School";
  const subjectLabel = subjectLabels[subject] ?? subject;

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />
      <section
        className={
          fullWidth
            ? "mx-auto w-full min-w-0 px-4 pt-28 pb-24 sm:px-6 lg:px-8"
            : "mx-auto max-w-4xl px-6 pt-28 pb-24"
        }
      >
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm">
          <Link href={base} className="text-neutral-400 transition hover:text-white">
            {levelLabel} {subjectLabel}
          </Link>
          {breadcrumbs.map((item, i) => (
            <span key={item.href}>
              <span className="text-neutral-600">/</span>
              {i === breadcrumbs.length - 1 ? (
                <span className="text-white">{item.label}</span>
              ) : (
                <Link href={item.href} className="text-neutral-400 transition hover:text-white">
                  {item.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
