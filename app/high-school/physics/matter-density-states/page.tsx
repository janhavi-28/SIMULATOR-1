import Link from "next/link";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import { SITE_URL } from "@/lib/seo";
import {
  MATTER_DENSITY_STATES_SUBTOPIC_SLUGS,
  MATTER_DENSITY_STATES_SUBTOPICS,
} from "@/lib/data/matter-density-states-subtopics";
import type { MatterDensityStatesSubtopicSlug } from "@/lib/data/matter-density-states-subtopics";
import MatterDensityStatesKeyFormulas from "./components/MatterDensityStatesKeyFormulas";
import MatterDensityStatesMisconceptions from "./components/MatterDensityStatesMisconceptions";
import MatterDensityStatesRealWorldApps from "./components/MatterDensityStatesRealWorldApps";
import StatesOfMatterSimulation from "@/components/simulations/physics/matter-density-states/StatesOfMatterSimulation";

const SUBTOPIC_ICONS: Record<MatterDensityStatesSubtopicSlug, string> = {
  "states-of-matter": "🧊",
  "change-of-state": "🔥",
  "latent-heat": "♨️",
  evaporation: "💨",
  density: "⚖️",
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Matter, Density & States | High School Physics",
  description:
    "High School Physics: Matter, Density & States – states of matter, change of state, latent heat, evaporation, and density. Interactive particle-level simulators with Launch, Pause, and Reset.",
  keywords: [
    "high school physics",
    "states of matter",
    "density",
    "latent heat",
    "evaporation",
    "change of state",
    "buoyancy",
    "interactive simulation",
  ],
  alternates: {
    canonical: `${SITE_URL}/high-school/physics/matter-density-states`,
  },
  openGraph: {
    title: "Matter, Density & States | High School Physics",
    description:
      "Matter, Density & States: solids, liquids, gases, change of state, latent heat, evaporation, and density. Interactive particle simulations.",
    url: `${SITE_URL}/high-school/physics/matter-density-states`,
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function HighSchoolPhysicsMatterDensityStatesPage() {
  const breadcrumbs = [
    { label: "Matter, Density & States", href: "/high-school/physics/matter-density-states" },
  ];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title="Matter, Density & States"
      fullWidth
      titleClassName="text-4xl sm:text-5xl font-extrabold tracking-wide text-white drop-shadow-sm border-b border-cyan-500/30 pb-2 inline-block"
      contentClassName="mt-3"
    >
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 mb-3 lg:mb-4 lg:items-center">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="text-base text-neutral-300 max-w-xl leading-relaxed">
            Explore how matter behaves as solids, liquids, and gases; how it changes state with
            heating and cooling; how latent heat works; how evaporation causes cooling; and how
            density explains floating and sinking. Use the interactive particle simulator below to
            compare solids, liquids, and gases — adjust temperature, particle count, and container
            volume. Use <strong>Launch</strong> to start, then <strong>Play</strong> /{" "}
            <strong>Pause</strong> and <strong>Reset</strong> to explore.
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-6 lg:border-l border-neutral-600 lg:shadow-[inset_1px_0_0_0_rgba(34,211,238,0.12)] flex flex-col justify-center">
          <ul className="text-sm text-neutral-400 space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>
                🧊
              </span>
              <span>
                <strong className="text-cyan-200 font-bold">States of matter</strong> — solids,
                liquids, and gases in the particle model
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>
                🔥
              </span>
              <span>
                <strong className="text-cyan-200 font-bold">Change of state</strong> — melting,
                boiling, and flat regions on heating curves
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>
                ♨️
              </span>
              <span>
                <strong className="text-cyan-200 font-bold">Latent heat</strong> — Q = mL during
                phase change at constant temperature
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>
                💨
              </span>
              <span>
                <strong className="text-cyan-200 font-bold">Evaporation</strong> — surface escape of
                high-energy molecules and cooling
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg leading-none shrink-0" aria-hidden>
                ⚖️
              </span>
              <span>
                <strong className="text-cyan-200 font-bold">Density &amp; buoyancy</strong> — ρ =
                m/V, upthrust, and floating vs sinking
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Flagship simulator: States of matter particle box */}
      <div
        id="simulator"
        className="flex flex-col flex-1 min-h-0 max-w-[1600px] w-full mx-auto rounded-2xl border border-neutral-700 bg-neutral-950/80 overflow-visible mb-8 shadow-lg shadow-black/20 scroll-mt-24 transition-[box-shadow] duration-300 min-h-[620px] lg:min-h-[720px] xl:min-h-[780px] px-[clamp(16px,3vw,32px)]"
      >
        <StatesOfMatterSimulation />
      </div>

      <MatterDensityStatesKeyFormulas />
      <MatterDensityStatesRealWorldApps />
      <MatterDensityStatesMisconceptions />

      <section
        id="subtopics"
        className="mt-8 pt-6 border-t border-neutral-800/80 scroll-mt-24"
      >
        <div className="mb-5 rounded-lg border border-neutral-700/40 bg-neutral-900/20 px-4 py-4">
          <h3 className="text-sm font-semibold text-white mb-3">Chapter Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 mb-2">
                How to Study This Chapter
              </h4>
              <ul className="text-sm text-neutral-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>
                    🟢
                  </span>
                  Start with states of matter using the particle model
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>
                    🔥
                  </span>
                  Build: change of state → latent heat → heating curves
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>
                    💨
                  </span>
                  Connect evaporation to particle energy and cooling
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>
                    ⚖️
                  </span>
                  Apply density and buoyancy to floating and sinking problems
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">What You&apos;ll Learn</h4>
              <ul className="text-sm text-neutral-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>
                    🧊
                  </span>
                  Describe solids, liquids, and gases in terms of particles
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>
                    🔥
                  </span>
                  Interpret heating curves and phase changes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>
                    ♨️
                  </span>
                  Use Q = mL and Q = mcΔT
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>
                    ⚖️
                  </span>
                  Use density and upthrust to explain floating and sinking
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Subtopics – Matter, Density &amp; States</h2>
        <p className="text-neutral-400 text-sm max-w-3xl mb-6 leading-relaxed">
          Each subtopic has a dedicated page with explanations and an interactive particle-based
          simulator.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MATTER_DENSITY_STATES_SUBTOPIC_SLUGS.map((slug) => {
            const sub = MATTER_DENSITY_STATES_SUBTOPICS[slug as MatterDensityStatesSubtopicSlug];
            const icon = SUBTOPIC_ICONS[slug as MatterDensityStatesSubtopicSlug];
            return (
              <Link
                key={slug}
                href={`/high-school/physics/matter-density-states/subtopics/${slug}`}
                className="block rounded-xl border border-neutral-700 bg-neutral-800/60 p-4 transition hover:border-cyan-500/50 hover:bg-neutral-800 hover:shadow-lg hover:shadow-cyan-500/15 hover:-translate-y-0.5"
              >
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <span className="text-base text-cyan-400/80 shrink-0" aria-hidden>
                    {icon}
                  </span>
                  {sub.title}
                </h3>
                <p className="mt-1 text-xs text-neutral-400 leading-snug line-clamp-2">
                  {sub.shortDescription}
                </p>
                <span className="mt-2 inline-block text-xs font-medium text-cyan-300">
                  Read more →
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-700 flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-center text-sm">
          <Link
            href="/high-school/physics/sound"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-medium text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
          >
            ➡️ Next: Sound
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

