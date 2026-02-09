import Link from "next/link";
import { physicsChapters } from "@/app/subjects/class-11/physics/chapters-data";

export default function PhysicsSubjectPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />
      <section className="mx-auto max-w-7xl px-6 pt-28 pb-12">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Physics – Interactive demos
        </h1>
        <p className="mt-4 text-lg text-neutral-400">
          Ready-to-use simulators and Class 11 chapters below.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Link
            href="/subjects/physics/gravity"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-emerald-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Gravity – Free fall & bounces</div>
            <p className="mt-2 text-sm text-neutral-400">
              Control g, height, mass and see motion under gravity.
            </p>
            <span className="mt-4 inline-block rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/rutherford-gold-foil"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-sky-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Rutherford gold foil experiment</div>
            <p className="mt-2 text-sm text-neutral-400">
              α-particles, gold foil, nucleus. Adjust Z, energy, emission rate.
            </p>
            <span className="mt-4 inline-block rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/special-relativity"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-amber-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Special Relativity – Time dilation & length contraction</div>
            <p className="mt-2 text-sm text-neutral-400">
              Moving spaceship and clocks. Adjust v/c to see time dilation and length contraction.
            </p>
            <span className="mt-4 inline-block rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/general-relativity"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-violet-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">General Relativity – Spacetime curvature & light bending</div>
            <p className="mt-2 text-sm text-neutral-400">
              Rubber-sheet spacetime and gravitational lensing. Adjust mass and impact parameter to see bending.
            </p>
            <span className="mt-4 inline-block rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/black-holes"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-cyan-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Black Holes – Event horizon, light bending & time dilation</div>
            <p className="mt-2 text-sm text-neutral-400">
              Event horizon, bent light rays, and time slowing near the hole. Adjust mass and impact parameter.
            </p>
            <span className="mt-4 inline-block rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/wormholes"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-teal-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Wormholes – Shortcuts in spacetime</div>
            <p className="mt-2 text-sm text-neutral-400">
              2D space folded into a tunnel. See shortcuts and why wormholes are unstable. Adjust throat, curvature, and stability.
            </p>
            <span className="mt-4 inline-block rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/time-travel"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-indigo-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Time Travel – Physics (CTCs) vs Sci‑Fi</div>
            <p className="mt-2 text-sm text-neutral-400">
              Closed timelike curves, timeline splitting, and why paradoxes happen. Adjust CTC strength, branches, and loop extent.
            </p>
            <span className="mt-4 inline-block rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/double-slit"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-sky-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Double Slit Experiment – Wave vs particle</div>
            <p className="mt-2 text-sm text-neutral-400">
              Particles gradually forming an interference pattern. Adjust wavelength, slit separation, and screen distance.
            </p>
            <span className="mt-4 inline-block rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/quantum-superposition"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-violet-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Quantum Superposition – Probability clouds</div>
            <p className="mt-2 text-sm text-neutral-400">
              States overlapping like Schrödinger&apos;s cat. Probability clouds instead of fixed positions; adjust |α|², phase, spread, and separation.
            </p>
            <span className="mt-4 inline-block rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/quantum-entanglement"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-fuchsia-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Quantum Entanglement – Instant correlation</div>
            <p className="mt-2 text-sm text-neutral-400">
              Two particles reacting together no matter the distance. Measure one and see the other correlate instantly.
            </p>
            <span className="mt-4 inline-block rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/quantum-tunneling"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-emerald-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Quantum Tunneling – Probability leak-through</div>
            <p className="mt-2 text-sm text-neutral-400">
              Energy barrier with E &lt; V₀: particles tunnel through classically forbidden regions. Adjust E/V₀, barrier width, and mass.
            </p>
            <span className="mt-4 inline-block rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
              Live illustration
            </span>
          </Link>
          <Link
            href="/subjects/physics/wave-function-collapse"
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 transition hover:border-cyan-500/50 hover:bg-neutral-900"
          >
            <div className="font-semibold text-white">Wave Function Collapse – Fuzzy → sharp on measurement</div>
            <p className="mt-2 text-sm text-neutral-400">
              Before measurement: fuzzy probability. After measurement: one sharp outcome. Click Measure to see collapse.
            </p>
            <span className="mt-4 inline-block rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
              Live illustration
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-8 border-t border-neutral-800">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Class 11 Physics – Chapters
        </h2>
        <p className="mt-2 text-neutral-400">
          Choose a chapter to see topics and subtopics.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {physicsChapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/subjects/class-11/physics/${chapter.id}`}
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 transition hover:-translate-y-0.5 hover:border-neutral-600 hover:bg-neutral-800"
            >
              <div className="font-semibold text-white group-hover:text-white">
                {chapter.title}
              </div>
              <span className="mt-2 inline-block text-sm text-neutral-400 group-hover:text-neutral-300">
                Open chapter →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
