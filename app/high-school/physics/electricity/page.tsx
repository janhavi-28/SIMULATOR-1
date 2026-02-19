import Link from "next/link";
import CircuitSimulation from "@/components/simulations/physics/CircuitSimulation";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import { SITE_URL } from "@/lib/seo";
import {
  ELECTRICITY_SUBTOPIC_SLUGS,
  ELECTRICITY_SUBTOPICS,
} from "@/lib/data/electricity-subtopics";
import type { ElectricitySubtopicSlug } from "@/lib/data/electricity-subtopics";
import ElectricityKeyFormulas from "./components/ElectricityKeyFormulas";

/** Icons for subtopic cards – conceptual, muted, consistent with dark theme */
const SUBTOPIC_ICONS: Record<ElectricitySubtopicSlug, string> = {
  "electric-charge": "⚡",
  "electric-current": "🔄",
  "electric-potential-and-potential-difference": "⬆️⬇️",
  "ohms-law": "📐",
  resistance: "🧱",
  "factors-affecting-resistance": "🧪",
  "electric-circuit": "🔌",
  "electrical-energy": "🔋",
  "electric-power": "🔥",
  "electric-motor": "⚙️" ,
};
import ElectricityRealWorldApps from "./components/ElectricityRealWorldApps";
import ElectricityConceptExplainer from "./components/ElectricityConceptExplainer";
import ElectricityMisconceptions from "./components/ElectricityMisconceptions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Electricity | High School Physics",
  description:
    "High School Physics: Electricity – electric charge, electric current, potential difference, Ohm's law, resistance, factors affecting resistance, electric circuits, electrical energy, and electric power. Interactive circuit simulator.",
  keywords: [
    "high school physics",
    "electricity",
    "electric charge",
    "electric current",
    "Ohm's law",
    "resistance",
    "electric circuit",
    "electrical energy",
    "electric power",
    "interactive simulation",
     "electric-motor",
  ],
  alternates: {
    canonical: `${SITE_URL}/high-school/physics/electricity`,
  },
  openGraph: {
    title: "Electricity | High School Physics",
    description:
      "Electricity: charge, current, voltage, Ohm's law, resistance, circuits, energy, power. Interactive circuit simulator.",
    url: `${SITE_URL}/high-school/physics/electricity`,
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function HighSchoolPhysicsElectricityPage() {
  const breadcrumbs = [{ label: "Electricity", href: "/high-school/physics/electricity" }];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title="Electricity"
      fullWidth
      titleClassName="text-4xl sm:text-5xl font-extrabold tracking-wide text-white drop-shadow-sm border-b border-cyan-500/30 pb-2 inline-block"
      contentClassName="mt-3"
    >
      {/* Hero: intro (left) + key concepts (right on desktop), vertically aligned */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 mb-3 lg:mb-4 lg:items-center">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="text-base text-neutral-300 max-w-xl leading-relaxed">
            Learn electric charge, electric current, electric potential and potential difference, Ohm&apos;s law, resistance, factors affecting resistance, electric circuits, electrical energy, and electric power. Use the interactive simulator below to explore a simple DC circuit: adjust voltage V and resistance R to see current {"I = V/R"} and power {"P = VI"}. Use <strong>Launch</strong> to start the animation and <strong>Play</strong> / <strong>Pause</strong> to control it.
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-6 lg:border-l border-neutral-600 lg:shadow-[inset_1px_0_0_0_rgba(34,211,238,0.12)] flex flex-col justify-center">
          <ul className="text-sm text-neutral-400 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>⚡</span>
              <span><strong className="text-cyan-200 font-bold">Current</strong> — flow of charge (A)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🔋</span>
              <span><strong className="text-cyan-200 font-bold">Voltage</strong> — potential difference (V)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🧱</span>
              <span><strong className="text-cyan-200 font-bold">Resistance</strong> — opposition to flow (Ω)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🔥</span>
              <span><strong className="text-cyan-200 font-bold">Power</strong> — energy rate (W)</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Simulator + parameters: wide professional layout, no clipping */}
      <div
        id="simulator"
        className="flex flex-col flex-1 min-h-0 max-w-[1600px] w-full mx-auto rounded-2xl border border-neutral-700 bg-neutral-950/80 overflow-visible mb-8 shadow-lg shadow-black/20 scroll-mt-24 transition-[box-shadow] duration-300 min-h-[620px] lg:min-h-[720px] xl:min-h-[780px] px-[clamp(16px,3vw,32px)]"
      >
        <CircuitSimulation />
      </div>

      <ElectricityKeyFormulas />

      <ElectricityRealWorldApps />

      <ElectricityConceptExplainer />

      <ElectricityMisconceptions />

      <section id="subtopics" className="mt-8 pt-6 border-t border-neutral-800/80 scroll-mt-24">
        {/* Chapter Guide – single orientation unit, two columns */}
        <div className="mb-5 rounded-lg border border-neutral-700/40 bg-neutral-900/20 px-4 py-4">
          <h3 className="text-sm font-semibold text-white mb-3">Chapter Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 mb-2">How to Study This Chapter</h4>
              <ul className="text-sm text-neutral-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🟢</span>
                  Start with Electric Charge
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🔄</span>
                  Build concepts: Current → Voltage → Resistance
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>📐</span>
                  Connect ideas using Ohm&apos;s Law
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>⚡</span>
                  Apply concepts with Power &amp; Energy simulations
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">What You&apos;ll Learn</h4>
              <ul className="text-sm text-neutral-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔍</span>
                  Explain how charge and current are related
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>📐</span>
                  Apply Ohm&apos;s law in simple circuits
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔌</span>
                  Understand basic circuit behaviour
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔋</span>
                  Interpret power and energy usage
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Subtopics Grid – primary focus, strongest visual weight */}
        <h2 className="text-xl font-semibold text-white mb-2">Subtopics – Electricity</h2>
        <p className="text-neutral-400 text-sm max-w-3xl mb-6 leading-relaxed">
          Each subtopic has a dedicated page with clear explanations and an interactive simulator where relevant.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ELECTRICITY_SUBTOPIC_SLUGS.map((slug) => {
            const sub = ELECTRICITY_SUBTOPICS[slug as ElectricitySubtopicSlug];
            const icon = SUBTOPIC_ICONS[slug as ElectricitySubtopicSlug];
            return (
              <Link
                key={slug}
                href={`/high-school/physics/electricity/subtopics/${slug}`}
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

        {/* Bottom CTA – clear but minimal */}
        <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-center text-sm">
          <Link
            href="/high-school/physics/motion"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
          >
            ➡️ Next: Motion &amp; Mechanics
          </Link>
          <Link
            href="/high-school/physics"
            className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 font-medium text-neutral-200 hover:bg-neutral-700 transition"
          >
            🧪 Explore more simulations
          </Link>
        </div>
      </section>
    </SeniorSecondaryTopicLayout>
  );
}
