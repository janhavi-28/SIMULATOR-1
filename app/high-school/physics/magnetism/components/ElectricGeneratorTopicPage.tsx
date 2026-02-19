"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import type { MagnetismSubtopicSlug } from "@/lib/data/magnetism-subtopics";
import MagnetismSubtopicSimulator from "@/components/simulations/physics/MagnetismSubtopicSimulator";
import { ChevronDown, ChevronRight } from "lucide-react";

const SECTION_GAP = "64px";
const CARD_RADIUS = 16;

const WHAT_IF_OPTIONS = [
  { id: "speed-doubles", label: "Rotation speed doubles", answer: "Frequency and peak EMF both double (E₀ ∝ ω)." },
  { id: "field-reverses", label: "Magnetic field reverses", answer: "EMF and current reverse direction; waveform flips sign." },
  { id: "area-increases", label: "Coil area increases", answer: "Peak EMF increases in proportion (E₀ ∝ A)." },
] as const;

export default function ElectricGeneratorTopicPage() {
  const [thinkOpen, setThinkOpen] = useState(false);
  const [whatIfActive, setWhatIfActive] = useState<string | null>(null);

  const scrollToSimulator = () => {
    document.getElementById("simulator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="sim-topic-container py-0"
      style={{ paddingTop: 0, paddingBottom: 96 }}
    >
      {/* 1. Core Concept (Generator Principle + Link to Induction — never separated) */}
      <section
        className="mb-8"
        style={{ marginBottom: SECTION_GAP }}
        aria-labelledby="core-concept-heading"
      >
        <h2
          id="core-concept-heading"
          className="mb-3 flex items-center gap-2 text-xl font-semibold text-white"
        >
          <span aria-hidden>⚡</span>
          Generator Principle
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
          A rotating coil cuts magnetic field lines, so the magnetic flux through the coil changes
          with time. According to Faraday’s law, this changing flux induces an emf in the coil. If
          the circuit is closed, an alternating current flows. The direction of the induced current
          is given by Fleming’s right-hand rule (motion, field, current).
        </p>

        <h3 className="mt-6 mb-2 flex items-center gap-2 text-lg font-semibold text-white">
          <span aria-hidden>🔗</span>
          Link to Induction
        </h3>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
          The generator works because of electromagnetic induction. Faraday’s law states that
          EMF ∝ dΦ/dt: the induced emf is proportional to the rate of change of magnetic flux.
          Faster rotation means more flux change per second, so both the magnitude of the emf and
          the frequency of the AC increase.
        </p>
      </section>

      {/* 2. Unified Key Takeaway (single, strong) */}
      <section className="mb-8" style={{ marginBottom: SECTION_GAP }} aria-label="Key takeaway">
        <div
          className="rounded-xl border-l-4 border-cyan-500 bg-cyan-500/10 px-5 py-3 shadow-[0_0_20px_-4px_rgba(34,211,238,0.2)]"
          style={{ borderRadius: 12 }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            ✔
          </span>{" "}
          <span className="text-sm font-medium text-slate-200">
            EMF is induced because magnetic flux through the rotating coil changes (Faraday’s Law).
          </span>
        </div>
      </section>

      {/* 3. Primary Interaction (Hero): Simulator — Generator → Live EMF → Waveform */}
      <section
        id="simulator"
        className="mb-8"
        style={{ marginBottom: SECTION_GAP }}
        aria-label="Simulator"
      >
        <div
          className="overflow-hidden rounded-[20px] border border-slate-700/60 shadow-xl"
          style={{
            background: "rgba(20, 30, 50, 0.85)",
            borderRadius: CARD_RADIUS,
          }}
        >
          <Suspense
            fallback={
              <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-500">
                Loading simulator…
              </div>
            }
          >
            <MagnetismSubtopicSimulator slug={"electric-generator" as MagnetismSubtopicSlug} />
          </Suspense>
        </div>
      </section>

      {/* 4. Reinforcement CTA — short, no long explanation */}
      <section className="mb-8" style={{ marginBottom: SECTION_GAP }} aria-label="Simulator CTA">
        <button
          type="button"
          onClick={scrollToSimulator}
          className="flex w-full flex-col items-start gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-4 text-left transition hover:border-cyan-400/50 hover:bg-cyan-500/15"
          style={{ borderRadius: CARD_RADIUS }}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
            <span aria-hidden>🎮</span>
            See It in Action
          </span>
          <p className="text-xs text-slate-400">
            Use the simulator above to observe: EMF variation · Current reversal · Effect of rotation speed
          </p>
        </button>
      </section>

      {/* 5. Exploratory Logic — What Happens If? (horizontal chips) */}
      <section
        className="mb-8"
        style={{ marginBottom: SECTION_GAP }}
        aria-labelledby="whatif-heading"
      >
        <h2 id="whatif-heading" className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
          <span aria-hidden>🔄</span>
          What Happens If?
        </h2>
        <div className="flex flex-wrap gap-2">
          {WHAT_IF_OPTIONS.map((opt) => {
            const active = whatIfActive === opt.id;
            return (
              <div key={opt.id} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setWhatIfActive(active ? null : opt.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200"
                      : "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {opt.label}
                </button>
                {active && <span className="max-w-[280px] text-xs text-slate-400">{opt.answer}</span>}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Pattern Recognition — Exploration → Pattern */}
      <section
        className="mb-8"
        style={{ marginBottom: SECTION_GAP }}
        aria-labelledby="pattern-heading"
      >
        <h2 id="pattern-heading" className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
          <span aria-hidden>📊</span>
          Coil Angle → EMF Value
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { angle: "0°", emf: "0" },
            { angle: "90°", emf: "Max" },
            { angle: "180°", emf: "0" },
            { angle: "270°", emf: "Min" },
          ].map((row) => (
            <div
              key={row.angle}
              className="rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-2.5 text-center"
            >
              <div className="font-mono text-sm font-medium text-cyan-300">{row.angle}</div>
              <div className="text-[10px] text-slate-500">→</div>
              <div className="font-mono text-sm font-medium text-slate-200">{row.emf}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Reflective Question — now has context after pattern */}
      <section
        className="mb-8"
        style={{ marginBottom: SECTION_GAP }}
        aria-labelledby="think-heading"
      >
        <button
          type="button"
          onClick={() => setThinkOpen(!thinkOpen)}
          className="flex w-full flex-col items-start gap-1 rounded-xl border border-slate-700/50 bg-slate-800/40 px-5 py-4 text-left transition hover:border-slate-600"
          style={{ borderRadius: CARD_RADIUS }}
        >
          <span className="flex w-full items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <span aria-hidden>💬</span>
              Think About This
            </span>
            {thinkOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            )}
          </span>
          <span className="text-sm text-slate-400">
            Why does EMF become zero when the coil is parallel to the magnetic field?
          </span>
        </button>
        {thinkOpen && (
          <div className="mt-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm text-slate-200">
            When the coil is parallel to the field, the flux through the coil is maximum (Φ = BA)
            but the <em>rate of change</em> of flux is zero at that instant. Since EMF ∝ dΦ/dt,
            the induced EMF is zero. As the coil rotates away, flux starts to change and EMF appears.
          </div>
        )}
      </section>

      {/* 8. Compression Block — distinct but not flashy */}
      <section
        className="mb-8"
        style={{ marginBottom: SECTION_GAP }}
        aria-label="10-second revision"
      >
        <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-white">
          <span aria-hidden>⚡</span>
          Generator in 10 Seconds
        </h2>
        <div className="rounded-xl border border-slate-600/60 bg-slate-800/40 px-5 py-3">
          <p className="text-sm text-slate-200">
            Mechanical energy → Rotating coil → Changing flux → AC electricity
          </p>
        </div>
      </section>

      {/* 9. Visual Flow Recap — micro chips, low visual weight */}
      <section className="mb-8" aria-label="Concept flow recap">
        <div className="flex flex-wrap items-center justify-center gap-1.5 py-3 text-xs text-slate-400">
          <span className="rounded-md bg-slate-800/50 px-2 py-1 text-slate-300">Rotation</span>
          <span className="text-slate-600">↓</span>
          <span className="rounded-md bg-slate-800/50 px-2 py-1 text-slate-300">Flux changes</span>
          <span className="text-slate-600">↓</span>
          <span className="rounded-md bg-slate-800/50 px-2 py-1 text-slate-300">EMF induced</span>
          <span className="text-slate-600">↓</span>
          <span className="rounded-md bg-slate-800/50 px-2 py-1 text-slate-300">Current flows</span>
        </div>
      </section>

      {/* 10. Navigation (footer level — minimal) */}
      <nav className="flex flex-wrap gap-3 border-t border-slate-700/50 pt-6" aria-label="Page navigation">
        <Link
          href="/high-school/physics/magnetism"
          className="rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700/50 hover:text-white"
        >
          ← Back to Magnetism
        </Link>
        <Link
          href="/high-school/physics/magnetism#subtopics"
          className="rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700/50 hover:text-white"
        >
          View all subtopics
        </Link>
      </nav>
    </div>
  );
}
