import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import { SITE_URL } from "@/lib/seo";
import {
  MAGNETISM_SUBTOPIC_SLUGS,
  MAGNETISM_SUBTOPICS,
  type MagnetismSubtopicSlug,
} from "@/lib/data/magnetism-subtopics";
import MagnetismKeyFormulas from "./components/MagnetismKeyFormulas";
import MagnetismRealWorldApps from "./components/MagnetismRealWorldApps";
import MagnetismMisconceptions from "./components/MagnetismMisconceptions";
import MagneticFieldSimulation from "@/components/simulations/physics/magnetism/MagneticFieldSimulation";

const MAGNETISM_SUBTOPIC_ICONS: Record<MagnetismSubtopicSlug, string> = {
  "magnetic-field": "🧲",
  "magnetic-field-lines": "🌀",
  "field-due-to-current": "🔌",
  "flemings-left-hand-rule": "✋",
  "flemings-right-hand-rule": "🤚",
  "electromagnetic-induction": "⚡",
  "electric-motor": "⚙️",
  "electric-generator": "🔄",
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Magnetism & Electromagnetism | High School Physics",
  description:
    "High School Physics: Magnetism & Electromagnetism – magnetic fields, field lines, fields due to currents, Fleming’s rules, electromagnetic induction, motors, and generators. Interactive magnetic field and induction simulators.",
  keywords: [
    "high school physics",
    "magnetism",
    "magnetic field",
    "electromagnetism",
    "electromagnetic induction",
    "electric motor",
    "electric generator",
    "Fleming's left-hand rule",
    "Fleming's right-hand rule",
    "interactive simulation",
  ],
  alternates: {
    canonical: `${SITE_URL}/high-school/physics/magnetism`,
  },
  openGraph: {
    title: "Magnetism & Electromagnetism | High School Physics",
    description:
      "Magnetism & Electromagnetism: fields, currents, induction, motors, and generators. Explore live simulations of fields and machines.",
    url: `${SITE_URL}/high-school/physics/magnetism`,
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function HighSchoolPhysicsMagnetismPage() {
  const breadcrumbs = [{ label: "Magnetism & Electromagnetism", href: "/high-school/physics/magnetism" }];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title="Magnetism & Electromagnetism"
      fullWidth
      titleClassName="text-4xl sm:text-5xl font-extrabold tracking-wide text-white drop-shadow-sm border-b border-cyan-500/30 pb-2 inline-block"
      contentClassName="mt-3"
    >
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 mb-3 lg:mb-4 lg:items-center">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="text-base text-neutral-300 max-w-xl leading-relaxed">
            Learn how magnets and currents create magnetic fields, how changing magnetic flux induces
            emf, and how these ideas power motors, generators, transformers, trains, and more. Use the
            interactive simulator below to explore the magnetic field around a bar magnet with compass
            needles, vector fields, and iron-filings view. Use <strong>Launch</strong> to start; then{" "}
            <strong>Play</strong> / <strong>Pause</strong> and <strong>Reset</strong> to explore.
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-6 lg:border-l border-neutral-600 lg:shadow-[inset_1px_0_0_0_rgba(34,211,238,0.12)] flex flex-col justify-center">
          <ul className="text-sm text-neutral-400 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🧲</span>
              <span><strong className="text-cyan-200 font-bold">Magnetic field</strong> — region where a magnet or current exerts force</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🌀</span>
              <span><strong className="text-cyan-200 font-bold">Field lines</strong> — N → S, closer where field is stronger</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>✋</span>
              <span><strong className="text-cyan-200 font-bold">Fleming’s rules</strong> — directions for force and induced current</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>⚡</span>
              <span><strong className="text-cyan-200 font-bold">Electromagnetic induction</strong> — emf from changing magnetic flux</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>⚙️</span>
              <span><strong className="text-cyan-200 font-bold">Motors &amp; generators</strong> — electrical ↔ mechanical energy</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Flagship simulator */}
      <div
        id="simulator"
        className="flex flex-col flex-1 min-h-0 max-w-[1600px] w-full mx-auto rounded-2xl border border-neutral-700 bg-neutral-950/80 overflow-visible mb-8 shadow-lg shadow-black/20 scroll-mt-24 transition-[box-shadow] duration-300 min-h-[620px] lg:min-h-[720px] xl:min-h-[780px] px-[clamp(16px,3vw,32px)]"
      >
        <MagneticFieldSimulation />
      </div>

      <MagnetismKeyFormulas />
      <MagnetismRealWorldApps />
      <MagnetismMisconceptions />

      <section id="subtopics" className="mt-8 pt-6 border-t border-neutral-800/80 scroll-mt-24">
        <div className="mb-5 rounded-lg border border-neutral-700/40 bg-neutral-900/20 px-4 py-4">
          <h3 className="text-sm font-semibold text-white mb-3">Chapter Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 mb-2">How to Study This Chapter</h4>
              <ul className="text-sm text-neutral-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🟢</span>
                  Start with magnetic fields and field lines around bar magnets
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🔌</span>
                  Build: fields due to currents and Fleming’s rules
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>⚡</span>
                  Explore electromagnetic induction and EMF vs time
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>⚙️</span>
                  Apply principles to motors, generators, and real-world devices
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">What You&apos;ll Learn</h4>
              <ul className="text-sm text-neutral-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🧲</span>
                  Describe and visualise magnetic fields and field lines
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>✋</span>
                  Use Fleming’s left-hand and right-hand rules correctly
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>⚡</span>
                  Explain electromagnetic induction and EMF ∝ dΦ/dt
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔄</span>
                  Understand how motors and generators interconvert energy
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Subtopics – Magnetism &amp; Electromagnetism</h2>
        <p className="text-neutral-400 text-sm max-w-3xl mb-6 leading-relaxed">
          Each subtopic has a dedicated page with clear explanations and an interactive simulator.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MAGNETISM_SUBTOPIC_SLUGS.map((slug) => {
            const sub = MAGNETISM_SUBTOPICS[slug as MagnetismSubtopicSlug];
            const icon = MAGNETISM_SUBTOPIC_ICONS[slug as MagnetismSubtopicSlug];
            return (
              <Link
                key={slug}
                href={`/high-school/physics/magnetism/subtopics/${slug}`}
                className="block rounded-xl border border-neutral-700 bg-neutral-800/60 p-4 transition hover:border-cyan-500/50 hover:bg-neutral-800 hover:shadow-lg hover:shadow-cyan-500/15 hover:-translate-y-0.5"
              >
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <span className="text-base text-cyan-400/80 shrink-0" aria-hidden>{icon}</span>
                  {sub.title}
                </h3>
                <p className="mt-1 text-xs text-neutral-400 leading-snug line-clamp-2">
                  {sub.shortDescription}
                </p>
                <span className="mt-2 inline-block text-xs font-medium text-cyan-300">Read more →</span>
              </Link>
            );
          })}
        </div>
      </section>
    </SeniorSecondaryTopicLayout>
  );
}

