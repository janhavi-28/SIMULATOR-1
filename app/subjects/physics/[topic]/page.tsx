import { notFound } from "next/navigation";
import { physicsTopicMeta } from "@/lib/registries/physics";
import PhysicsSimulationLoader from "@/components/PhysicsSimulationLoader";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ topic: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { topic } = await params;
  const meta = physicsTopicMeta[topic];
  if (!meta) return { title: "Topic not found" };
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function PhysicsTopicPage({ params }: PageProps) {
  const { topic } = await params;
  const meta = physicsTopicMeta[topic];

  if (!meta) {
    notFound();
  }

  const displayTitles: Record<string, string> = {
    gravity: "Gravity – Free fall & bounces",
    "rutherford-gold-foil": "Rutherford Gold Foil Experiment",
    "projectile-motion": "Projectile Motion Simulator",
    "velocity-time-position-time-graphs": "Velocity–Time and Position–Time Graphs",
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

  return (
    <>
      {/* SEO content: server-rendered so crawlers see it in first HTML */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {displayTitle}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            {meta.description}
          </p>
        </div>
      </section>

        {/* Client-only simulation (lazy-loaded, not run at build time) */}
        <PhysicsSimulationLoader topic={topic} />
    </>
  );
}
