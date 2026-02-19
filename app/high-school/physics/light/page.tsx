import LazyPhysicsSimulationLoader from "@/components/LazyPhysicsSimulationLoader";

export const dynamic = "force-dynamic";

export default function HighSchoolPhysicsLightPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pt-24 pb-16">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            High School Physics – Light (Scattering &amp; Units)
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-300">
            Use this interactive scattering simulator to build intuition for how
            physical quantities and units (MeV, femtometre, relative mass) tie
            into dramatic deflections of particle‑like light rays. All content
            lives in a single, focused page.
          </p>
        </header>

        <LazyPhysicsSimulationLoader topic="physical-world-and-units" />
      </section>
    </main>
  );
}

