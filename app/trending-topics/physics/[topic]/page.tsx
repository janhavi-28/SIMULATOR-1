import { notFound } from "next/navigation";
import { physicsTopicMeta } from "@/lib/registries/physics";
import PhysicsSimulationLoader from "@/components/PhysicsSimulationLoader";
import { SimulationJsonLd } from "@/components/JsonLd";
import { TRENDING_TOPICS_PHYSICS_SIMS } from "@/lib/data/simulation-mapping";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ topic: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { topic } = await params;
  const meta = physicsTopicMeta[topic];
  if (!meta) return { title: "Topic not found" };

  const canonical = `${SITE_URL}/trending-topics/physics/${topic}`;
  const keywords = meta.keywords
    ? [...meta.keywords, "physics simulation", "interactive", "illustrate.live"]
    : ["physics simulation", "interactive", "illustrate.live"];

  return {
    title: meta.title.replace(" | Physics", ""),
    description: meta.description,
    keywords: keywords.join(", "),
    alternates: { canonical },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonical,
      type: "article",
      siteName: "Illustrate.live",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function TrendingTopicsPhysicsTopicPage({ params }: PageProps) {
  const { topic } = await params;

  if (!(TRENDING_TOPICS_PHYSICS_SIMS as readonly string[]).includes(topic)) {
    notFound();
  }

  const meta = physicsTopicMeta[topic];
  if (!meta) notFound();

  const displayTitles: Record<string, string> = {
    gravity: "Gravity – Free fall & bounces",
    "rutherford-gold-foil": "Rutherford Gold Foil Experiment",
    "special-relativity": "Special Relativity – Time Dilation & Length Contraction",
    "general-relativity": "General Relativity – Spacetime Curvature & Light Bending",
    "black-holes": "Black Holes – Event Horizon, Light Bending & Time Dilation",
    wormholes: "Wormholes – Shortcuts in Spacetime",
    "time-travel": "Time Travel – Physics (CTCs) vs Sci‑Fi",
    "double-slit": "Double Slit Experiment",
    "quantum-superposition": "Quantum Superposition",
    "quantum-entanglement": "Quantum Entanglement",
    "quantum-tunneling": "Quantum Tunneling",
    "wave-function-collapse": "Wave Function Collapse",
  };
  const displayTitle = displayTitles[topic] ?? meta.title;
  const canonicalUrl = `${SITE_URL}/trending-topics/physics/${topic}`;

  return (
    <>
      <SimulationJsonLd
        name={displayTitle}
        description={meta.description}
        url={canonicalUrl}
        keywords={meta.keywords}
      />
      <article>
        <section className="mx-auto max-w-7xl px-6 pt-10 pb-4">
          <nav className="mb-4 text-sm" aria-label="Breadcrumb">
            <a
              href="/trending-topics/physics"
              className="text-neutral-400 hover:text-white transition"
            >
              ← Trending Topics Physics
            </a>
          </nav>
          <header className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-white">{displayTitle}</h1>
            <p className="mt-2 max-w-3xl text-sm text-neutral-400" role="doc-subtitle">
              {meta.description}
            </p>
            <p className="mt-4 max-w-3xl text-base text-neutral-300">
              Use the interactive simulation below to explore this physics concept. Adjust the controls to see how parameters affect the outcome. This educational tool helps students and learners visualize complex ideas through hands-on experimentation.
            </p>
          </header>
        </section>
        <PhysicsSimulationLoader topic={topic} />
      </article>
    </>
  );
}
