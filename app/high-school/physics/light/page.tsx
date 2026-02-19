import Link from "next/link";
import ReflectionRefractionSimulator from "@/components/simulations/physics/ReflectionRefractionSimulator";
import SeniorSecondaryTopicLayout from "@/app/components/SeniorSecondaryTopicLayout";
import { SITE_URL } from "@/lib/seo";
import { LIGHT_OPTICS_SUBTOPIC_SLUGS, LIGHT_OPTICS_SUBTOPICS } from "@/lib/data/light-optics-subtopics";
import type { SubtopicSlug } from "@/lib/data/light-optics-subtopics";
import LightKeyFormulas from "./components/LightKeyFormulas";

/** Icons for subtopic cards – match Electricity style */
const LIGHT_SUBTOPIC_ICONS: Record<SubtopicSlug, string> = {
  "reflection-of-light": "🪞",
  "refraction-of-light": "💧",
  "laws-of-reflection": "📐",
  "laws-of-refraction": "📐",
  "image-formation-plane-mirror": "🪞",
  "image-formation-spherical-mirrors": "🔮",
  "ray-diagrams": "📐",
  "refraction-glass-slab": "📦",
  "refraction-by-lenses": "🔍",
  magnification: "📏",
};
import LightRealWorldApps from "./components/LightRealWorldApps";
import LightMisconceptions from "./components/LightMisconceptions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Light and Optics | High School Physics",
  description:
    "High School Physics: Light and Optics – reflection of light, refraction of light, laws of reflection and refraction, image formation by plane and spherical mirrors, ray diagrams, refraction through glass slab, refraction by lenses, and magnification. Interactive Snell's law simulator with launch and pause.",
  keywords: [
    "high school physics",
    "light and optics",
    "reflection of light",
    "refraction of light",
    "laws of reflection",
    "laws of refraction",
    "Snell's law",
    "plane mirror",
    "spherical mirrors",
    "ray diagrams",
    "lenses",
    "magnification",
    "interactive simulation",
  ],
  alternates: {
    canonical: `${SITE_URL}/high-school/physics/light`,
  },
  openGraph: {
    title: "Light and Optics | High School Physics",
    description:
      "Light and Optics: reflection, refraction, mirrors, lenses, magnification. Interactive simulator for Snell's law and total internal reflection.",
    url: `${SITE_URL}/high-school/physics/light`,
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function HighSchoolPhysicsLightPage() {
  const breadcrumbs = [{ label: "Light and Optics", href: "/high-school/physics/light" }];

  return (
    <SeniorSecondaryTopicLayout
      level="high-school"
      subject="physics"
      breadcrumbs={breadcrumbs}
      title="Light and Optics"
      fullWidth
      titleClassName="text-4xl sm:text-5xl font-extrabold tracking-wide text-white drop-shadow-sm border-b border-cyan-500/30 pb-2 inline-block"
      contentClassName="mt-3"
    >
      {/* Hero: intro (compact) so simulator dominates first viewport */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-0 mb-2 lg:mb-3 lg:items-center">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="text-sm text-neutral-300 max-w-xl leading-relaxed">
            Learn reflection and refraction, Snell&apos;s law, and total internal reflection. Use the simulator below—adjust the incident angle and media to see how light bends at interfaces.
          </p>
        </div>
        <div className="lg:col-span-5 lg:pl-6 lg:border-l border-neutral-600 lg:shadow-[inset_1px_0_0_0_rgba(34,211,238,0.12)] flex flex-col justify-center">
          <ul className="text-xs text-neutral-400 space-y-2">
            <li className="flex items-start gap-2"><span aria-hidden>🪞</span><span><strong className="text-cyan-200">Reflection</strong> — light bouncing from a surface</span></li>
            <li className="flex items-start gap-2"><span aria-hidden>💧</span><span><strong className="text-cyan-200">Refraction</strong> — bending between media</span></li>
            <li className="flex items-start gap-2"><span aria-hidden>📐</span><span><strong className="text-cyan-200">Snell&apos;s law</strong> — n₁ sin θ₁ = n₂ sin θ₂</span></li>
          </ul>
        </div>
      </section>

      {/* Simulator – hero: flex, fill height, min 90vh; canvas fills container with zero clipping */}
      <div
        id="simulator"
        className="flex flex-col max-w-[1600px] w-full mx-auto rounded-2xl border border-neutral-700 bg-neutral-950/80 overflow-hidden mb-6 shadow-lg shadow-black/20 scroll-mt-24 min-h-[75vh] md:min-h-[80vh] lg:min-h-[90vh] h-[75vh] md:h-[80vh] lg:h-[90vh]"
      >
        <ReflectionRefractionSimulator />
      </div>

      <LightKeyFormulas />
      <LightRealWorldApps />
      <LightMisconceptions />

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
                  Start with Reflection of light
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>💧</span>
                  Build concepts: Refraction → Snell&apos;s law → Lenses
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>📐</span>
                  Connect ideas using mirror and lens formulas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/80 shrink-0" aria-hidden>🔍</span>
                  Apply ray diagrams and magnification in the simulator
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">What You&apos;ll Learn</h4>
              <ul className="text-sm text-neutral-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🔍</span>
                  Explain reflection and refraction
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>📐</span>
                  Use Snell&apos;s law and mirror/lens formulas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>🪞</span>
                  Understand image formation by mirrors and lenses
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400/70 shrink-0 text-xs" aria-hidden>📏</span>
                  Interpret magnification and ray diagrams
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Subtopics – Light and Optics</h2>
        <p className="text-neutral-400 text-sm max-w-3xl mb-6 leading-relaxed">
          Each subtopic has a dedicated page with clear explanations and an interactive simulator where relevant.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LIGHT_OPTICS_SUBTOPIC_SLUGS.map((slug) => {
            const sub = LIGHT_OPTICS_SUBTOPICS[slug as SubtopicSlug];
            const icon = LIGHT_SUBTOPIC_ICONS[slug as SubtopicSlug];
            return (
              <Link
                key={slug}
                href={`/high-school/physics/light/subtopics/${slug}`}
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

