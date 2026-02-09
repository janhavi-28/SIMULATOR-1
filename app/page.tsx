import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 pt-28 pb-20 text-center">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-white">
          Illustrated Concepts
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-xl text-neutral-400">
          See science in action.
          <span className="block">
            Change parameters. Watch concepts come alive.
          </span>
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            href="/subjects"
            className="rounded-2xl bg-white px-10 py-4 text-black font-semibold hover:bg-neutral-200 transition"
          >
            Explore Concepts →
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Interactive",
              desc: "Adjust values and instantly see changes in behavior, motion, or reactions.",
            },
            {
              title: "Visual First",
              desc: "Designed to build intuition before formulas and definitions.",
            },
            {
              title: "Concept Focused",
              desc: "Each page explains one idea deeply, not superficially.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8"
            >
              <h3 className="text-xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-neutral-400 text-base">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive demos – at bottom of landing page */}
      <section className="border-t border-neutral-800">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white">
              Start with one concept.
            </h2>
            <p className="mt-4 text-lg text-neutral-400">
              Understanding begins with seeing. Try these interactive demos.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Link
              href="/subjects/physics/gravity"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Gravity – Free fall & bounces
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Visualize motion under gravity with live control of g, height, and initial velocity.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 group-hover:border-emerald-400 group-hover:bg-emerald-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/rutherford-gold-foil"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Rutherford gold foil experiment
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Watch α-particles scatter from a tiny nucleus with controllable Z and energy.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 group-hover:border-sky-400 group-hover:bg-sky-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/special-relativity"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Special Relativity – Time dilation & length contraction
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Moving spaceship and clocks: see time dilation and length contraction as v/c changes.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 group-hover:border-amber-400 group-hover:bg-amber-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/general-relativity"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                General Relativity – Spacetime curvature & light bending
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Rubber-sheet spacetime and gravitational lensing: see mass curve the grid and light rays bend.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 group-hover:border-violet-400 group-hover:bg-violet-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/black-holes"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Black Holes – Event horizon, light bending & time dilation
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Event horizon, bent light rays, and time slowing near the hole. Adjust mass and impact parameter.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 group-hover:border-cyan-400 group-hover:bg-cyan-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/wormholes"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Wormholes – Shortcuts in spacetime
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                2D space folded into a tunnel: see shortcuts and why wormholes are unstable. Adjust throat, curvature, and stability.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-300 group-hover:border-teal-400 group-hover:bg-teal-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/time-travel"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Time Travel – Physics (CTCs) vs Sci‑Fi
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Closed timelike curves, timeline splitting, and why paradoxes happen. Compare physics-allowed CTCs with Sci‑Fi paradox zones.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 group-hover:border-indigo-400 group-hover:bg-indigo-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/double-slit"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Double Slit Experiment – Wave vs particle
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Particles gradually forming an interference pattern. Adjust wavelength, slit separation, and screen distance to see wave–particle duality.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 group-hover:border-sky-400 group-hover:bg-sky-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/quantum-superposition"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Quantum Superposition – Probability clouds
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                States overlapping like Schrödinger&apos;s cat. See probability clouds instead of fixed positions; adjust |α|², phase, and spread to explore interference.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 group-hover:border-violet-400 group-hover:bg-violet-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/quantum-entanglement"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Quantum Entanglement – Instant correlation
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Two particles reacting together no matter the distance. Measure one and see the other correlate instantly.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-300 group-hover:border-fuchsia-400 group-hover:bg-fuchsia-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/quantum-tunneling"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Quantum Tunneling – Probability leak-through
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Energy barrier with E &lt; V₀: particles tunnel through classically forbidden regions. Adjust E/V₀, barrier width, and mass to see transmission probability change.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 group-hover:border-emerald-400 group-hover:bg-emerald-500/15">
                Live illustration · Open simulator
              </span>
            </Link>

            <Link
              href="/subjects/physics/wave-function-collapse"
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-900 text-left"
            >
              <div className="text-lg font-semibold text-white">
                Wave Function Collapse – Fuzzy → sharp on measurement
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Before measurement: fuzzy probability. After measurement: one sharp outcome. See how observation collapses the wave function.
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 group-hover:border-cyan-400 group-hover:bg-cyan-500/15">
                Live illustration · Open simulator
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
