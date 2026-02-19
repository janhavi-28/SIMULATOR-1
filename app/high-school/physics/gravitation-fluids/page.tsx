import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import GravitationFluidsMainSimulator from "./components/GravitationFluidsMainSimulator";
import { SITE_URL } from "@/lib/seo";
import {
  GRAVITATION_FLUIDS_SUBTOPIC_SLUGS,
  GRAVITATION_FLUIDS_SUBTOPICS,
} from "@/lib/data/gravitation-fluids-subtopics";
import type { GravitationFluidsSubtopicSlug } from "@/lib/data/gravitation-fluids-subtopics";
import GravitationFluidsKeyFormulas from "./components/GravitationFluidsKeyFormulas";
import GravitationFluidsRealWorldApps from "./components/GravitationFluidsRealWorldApps";
import GravitationFluidsMisconceptions from "./components/GravitationFluidsMisconceptions";

/** Icons for subtopic cards – match Electricity style */
const SUBTOPIC_ICONS: Record<GravitationFluidsSubtopicSlug, string> = {
  "universal-law-of-gravitation": "🌍",
  "acceleration-due-to-gravity": "⬇️",
  "free-fall": "📐",
  "mass-and-weight": "⚖️",
  "thrust-and-pressure": "💧",
  "pressure-in-fluids": "📐",
  buoyancy: "🚢",
  "archimedes-principle": "🚢",
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gravitation and Fluids | High School Physics",
  description:
    "High School Physics: Gravitation and Fluids – universal gravitation, acceleration due to gravity, free fall, mass and weight, thrust and pressure, pressure in fluids, buoyancy, Archimedes' principle. Interactive gravity simulator.",
  keywords: [
    "high school physics",
    "gravitation",
    "gravity",
    "free fall",
    "mass and weight",
    "pressure",
    "fluids",
    "buoyancy",
    "Archimedes' principle",
    "interactive simulation",
  ],
  alternates: {
    canonical: `${SITE_URL}/high-school/physics/gravitation-fluids`,
  },
  openGraph: {
    title: "Gravitation and Fluids | High School Physics",
    description:
      "Gravitation and Fluids: universal gravitation, g, free fall, mass and weight, pressure, buoyancy. Interactive gravity simulator.",
    url: `${SITE_URL}/high-school/physics/gravitation-fluids`,
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function HighSchoolPhysicsGravitationFluidsPage() {
  const breadcrumbs = [{ label: "Gravitation and Fluids", href: "/high-school/physics/gravitation-fluids" }];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title="Gravitation and Fluids"
      fullWidth
      titleClassName="text-4xl sm:text-5xl font-extrabold tracking-wide text-white drop-shadow-sm border-b border-cyan-500/30 pb-2 inline-block"
      contentClassName="mt-3"
    >
      {/* Hero: intro (left) + key concepts (right on desktop), match Electricity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 mb-3 lg:mb-4 lg:items-center">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="text-base text-neutral-300 max-w-xl leading-relaxed">
            Learn gravitational interaction, gravity near Earth, and the behaviour of fluids under pressure. Explore free fall, mass and weight, thrust and pressure, pressure in fluids, buoyancy, and Archimedes&apos; principle. Use the interactive simulator below to explore gravity: adjust masses and distance to see how force and motion change. Use <strong>Launch</strong> to start and <strong>Play</strong> / <strong>Pause</strong> to control it.
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-6 lg:border-l border-neutral-600 lg:shadow-[inset_1px_0_0_0_rgba(34,211,238,0.12)] flex flex-col justify-center">
          <ul className="text-sm text-neutral-400 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🌍</span>
              <span><strong className="text-cyan-200 font-bold">Gravitation</strong> — mutual attraction between masses (N)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>⬇️</span>
              <span><strong className="text-cyan-200 font-bold">Gravity (g)</strong> — acceleration due to Earth&apos;s gravity (m/s²)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>⚖️</span>
              <span><strong className="text-cyan-200 font-bold">Mass &amp; Weight</strong> — mass is intrinsic; weight depends on g</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>💧</span>
              <span><strong className="text-cyan-200 font-bold">Pressure</strong> — force per unit area (Pa)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>🚢</span>
              <span><strong className="text-cyan-200 font-bold">Buoyancy</strong> — upward force exerted by fluids</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Simulator – same container as other topics */}
      <div
        id="simulator"
        className="flex flex-col flex-1 min-h-0 max-w-[1600px] w-full mx-auto rounded-2xl border border-neutral-700 bg-neutral-950/80 overflow-visible mb-8 shadow-lg shadow-black/20 scroll-mt-24 transition-[box-shadow] duration-300 min-h-[620px] lg:min-h-[720px] xl:min-h-[780px] px-[clamp(16px,3vw,32px)]"
      >
        <GravitationFluidsMainSimulator />
      </div>

      <GravitationFluidsKeyFormulas />
      <GravitationFluidsRealWorldApps />
      <GravitationFluidsMisconceptions />

      <section id="subtopics" className="mt-8 pt-6 border-t border-neutral-800/80 scroll-mt-24">
        {/* Chapter Guide – match Electricity */}
        <div className="mb-5 rounded-lg border border-neutral-700/40 bg-neutral-900/20 px-4 py-4">
          <h3 className="text-sm font-semibold text-white mb-3">Chapter Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 mb-2">How to Study This Chapter</h4>
              <ul className="text-sm text-neutral-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🟢</span>
                  Start with Universal Law of Gravitation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>⬇️</span>
                  Build concepts: g → Free fall → Mass and weight
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>💧</span>
                  Connect ideas: Pressure → Fluids → Buoyancy
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🚢</span>
                  Apply Archimedes&apos; principle in the simulator
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">What You&apos;ll Learn</h4>
              <ul className="text-sm text-neutral-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔍</span>
                  Relate gravitation, g, and weight
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>📐</span>
                  Use F = Gm₁m₂/r² and P = hρg
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>💧</span>
                  Understand pressure in fluids
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🚢</span>
                  Interpret buoyancy and floating
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Subtopics – Gravitation and Fluids</h2>
        <p className="text-neutral-400 text-sm max-w-3xl mb-6 leading-relaxed">
          Each subtopic has a dedicated page with clear explanations and an interactive simulator where relevant.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GRAVITATION_FLUIDS_SUBTOPIC_SLUGS.map((slug) => {
            const sub = GRAVITATION_FLUIDS_SUBTOPICS[slug as GravitationFluidsSubtopicSlug];
            const icon = SUBTOPIC_ICONS[slug as GravitationFluidsSubtopicSlug];
            return (
              <Link
                key={slug}
                href={`/high-school/physics/gravitation-fluids/subtopics/${slug}`}
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

        <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-center text-sm">
          <Link
            href="/high-school/physics/electricity"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
          >
            ➡️ Next: Electricity
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
