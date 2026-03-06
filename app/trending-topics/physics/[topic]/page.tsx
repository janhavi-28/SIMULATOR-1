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
    resonance: "Resonance – Driven Oscillator",
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
        </section>
        <PhysicsSimulationLoader topic={topic} />
      </article>
    </>
  );
}
