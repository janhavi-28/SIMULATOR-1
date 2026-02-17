"use client";

import React, { useMemo, useState } from "react";

// Simple helper for formatting powers of ten
const formatPowerOfTen = (power: number) => {
  if (power === 0) return "1 m";
  return `10^${power} m`;
};

const getScaleUnit = (meters: number) => {
  const abs = Math.abs(meters);
  if (abs >= 1) return { value: meters, unit: "m" };
  if (abs >= 1e-2) return { value: meters * 100, unit: "cm" };
  if (abs >= 1e-3) return { value: meters * 1000, unit: "mm" };
  if (abs >= 1e-6) return { value: meters * 1e6, unit: "μm" };
  if (abs >= 1e-9) return { value: meters * 1e9, unit: "nm" };
  return { value: meters * 1e15, unit: "fm" };
};

const describeObjectAtScale = (power: number) => {
  if (power >= 0) return "Human height or everyday distances";
  if (power >= -2) return "Small objects like pens or coins";
  if (power >= -4) return "Ants, sand grains, and tiny insects";
  if (power >= -6) return "Cells and bacteria under a microscope";
  if (power >= -9) return "Atoms inside matter";
  if (power >= -12) return "Electron clouds and sub‑atomic structure";
  return "Atomic nucleus and deep sub‑nuclear scales";
};

type FormulaKey = "v=u+at" | "f=ma" | "t=2pi*sqrt(l/g)" | "unknown";

const normaliseFormula = (input: string): FormulaKey => {
  const cleaned = input.replace(/\s+/g, "").toLowerCase();
  if (cleaned === "v=u+at") return "v=u+at";
  if (cleaned === "f=ma") return "f=ma";
  if (cleaned === "t=2pi*sqrt(l/g)" || cleaned === "t=2π√(l/g)") {
    return "t=2pi*sqrt(l/g)";
  }
  return "unknown";
};

interface AccordionSectionProps {
  id: string;
  title: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  borderGlowClass: string;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  id,
  title,
  openId,
  setOpenId,
  borderGlowClass,
  children,
}) => {
  const isOpen = openId === id;

  return (
    <section
      className={`rounded-3xl border bg-neutral-950/80 shadow-lg transition-colors duration-300 ease-in-out ${borderGlowClass}`}
    >
      <button
        type="button"
        onClick={() => setOpenId(isOpen ? null : id)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left hover:bg-neutral-900/70"
        aria-expanded={isOpen}
      >
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-600 text-xs text-neutral-200 transition-transform duration-300 ease-in-out ${
            isOpen ? "rotate-90" : "rotate-0"
          }`}
          aria-hidden="true"
        >
          ▸
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-neutral-800 px-6 pb-6 pt-4">
          {children}
        </div>
      </div>
    </section>
  );
};

const PhysicalWorldMeasurementChapterContent: React.FC = () => {
  // Section 2 – Scale & Units Explorer
  const [scalePower, setScalePower] = useState(-2); // 10^-2 m initial

  const scaleInfo = useMemo(() => {
    const meters = Math.pow(10, scalePower);
    const { value, unit } = getScaleUnit(meters);
    const description = describeObjectAtScale(scalePower);
    return {
      meters,
      displayValue: value.toPrecision(3),
      unit,
      description,
    };
  }, [scalePower]);

  // Section 3 – Measurement simulator
  const trueLengthCm = 12.0;
  const [leastCount, setLeastCount] = useState(0.1); // cm
  const [measuredLength, setMeasuredLength] = useState(12.0);

  const measurementStats = useMemo(() => {
    const absoluteError = measuredLength - trueLengthCm;
    const percentageError = (absoluteError / trueLengthCm) * 100;
    return { absoluteError, percentageError };
  }, [measuredLength]);

  // Section 4 – Dimensional checker
  const [formulaInput, setFormulaInput] = useState("v = u + at");
  const key = normaliseFormula(formulaInput);

  const dimensionalResult = useMemo(() => {
    switch (key) {
      case "v=u+at":
        return {
          lhs: "[L T⁻¹]",
          rhs: "[L T⁻¹]",
          correct: true,
          note: "All terms represent velocity, so the equation is dimensionally consistent.",
        };
      case "f=ma":
        return {
          lhs: "[M L T⁻²]",
          rhs: "[M][L T⁻²] = [M L T⁻²]",
          correct: true,
          note: "Force and m·a both have dimensions of ML T⁻².",
        };
      case "t=2pi*sqrt(l/g)":
        return {
          lhs: "[T]",
          rhs: "2π·√( [L]/[L T⁻²] ) = [T]",
          correct: true,
          note: "Time period of a simple pendulum is dimensionally correct.",
        };
      default:
        return {
          lhs: "—",
          rhs: "—",
          correct: false,
          note: "Try one of the given examples above. Dimensional analysis here supports only a few standard formulas.",
        };
    }
  }, [key]);

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* SECTION 1 – What is Physics? */}
      <AccordionSection
        id="what-is-physics"
        title="1. What is Physics?"
        openId={openId}
        setOpenId={setOpenId}
        borderGlowClass="border-neutral-800 shadow-sky-900/40 hover:border-sky-500/60"
      >
        <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div>
            <p className="mt-1 text-sm text-neutral-200">
              Physics is the study of nature – how matter, energy, space and
              time behave. It looks for{" "}
              <span className="font-semibold text-sky-300">
                simple laws
              </span>{" "}
              that can explain many different phenomena.
            </p>
            <p className="mt-2 text-sm text-neutral-300">
              At school level, we mainly meet{" "}
              <span className="font-semibold">mechanics</span> (motion and
              forces), <span className="font-semibold">thermodynamics</span>{" "}
              (heat and temperature), <span className="font-semibold">optics</span>{" "}
              (light), <span className="font-semibold">electricity</span>, and{" "}
              <span className="font-semibold">modern physics</span> (atoms,
              nuclei, basic particles).
            </p>
            <div className="mt-4 rounded-2xl bg-neutral-900/80 p-3 text-xs text-neutral-200">
              <div className="font-semibold text-sky-300">
                What to observe
              </div>
              <p className="mt-1">
                Notice how one subject (physics) connects falling objects,
                glowing bulbs, hot tea cooling, lenses, and stars in the sky.
                All are described using a small set of physical quantities and
                laws.
              </p>
              <p className="mt-2 font-semibold text-emerald-300">
                Key takeaway: Physics looks for common rules behind very
                different natural phenomena.
              </p>
            </div>
          </div>

          {/* Simple illustrative graphic using SVGs and icons */}
          <div className="rounded-2xl border border-sky-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-sky-300">
              Physics all around us
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-900/70 p-3">
                <div className="text-xs font-semibold text-neutral-200">
                  Motion (Mechanics)
                </div>
                <div className="mt-2 h-16">
                  <div className="flex h-full items-end justify-between">
                    <div className="h-2 w-full rounded bg-slate-800" />
                    <div className="h-10 w-10 rounded-full bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.8)]" />
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Falling objects, moving cars, thrown balls.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/70 p-3">
                <div className="text-xs font-semibold text-neutral-200">
                  Heat &amp; Thermodynamics
                </div>
                <div className="mt-2 flex h-16 items-end gap-2">
                  <div className="h-10 w-8 rounded-t-full bg-gradient-to-t from-amber-500 via-orange-400 to-yellow-300 shadow-[0_0_20px_rgba(251,191,36,0.9)]" />
                  <div className="h-6 flex-1 rounded bg-slate-800" />
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Hot to cold flow, heating and cooling.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/70 p-3">
                <div className="text-xs font-semibold text-neutral-200">
                  Light &amp; Optics
                </div>
                <div className="mt-2 h-16">
                  <div className="relative h-full w-full rounded-lg bg-slate-950/80">
                    <div className="absolute left-1 top-1 h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
                    <div className="absolute left-3 top-2 h-[2px] w-24 bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300" />
                    <div className="absolute left-24 top-[10px] h-8 w-[2px] bg-slate-300" />
                    <div className="absolute left-24 top-[10px] h-[2px] w-16 origin-left rotate-10 bg-gradient-to-r from-cyan-300 to-purple-400" />
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Rays of light reflecting and refracting.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/70 p-3">
                <div className="text-xs font-semibold text-neutral-200">
                  Electricity &amp; Scale
                </div>
                <div className="mt-2 h-16">
                  <div className="flex h-full items-center justify-between">
                    <div className="h-2 w-20 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.9)]" />
                    <div className="text-[10px] text-neutral-400">
                      Atom → Solar system → Galaxy
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Charges in circuits, and physics from atomic to cosmic scales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* SECTION 2 – Physical Quantities & Units */}
      <AccordionSection
        id="physical-quantities-units"
        title="2. Physical Quantities & Units – Scale Explorer"
        openId={openId}
        setOpenId={setOpenId}
        borderGlowClass="border-neutral-800 shadow-cyan-900/40 hover:border-cyan-500/60"
      >
        <div className="mt-1 grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div>
            <p className="text-sm text-neutral-200">
              Any physical quantity is written as{" "}
              <span className="font-semibold text-emerald-300">
                number × unit
              </span>
              . For example, 3.0 m, 75 kg, 2.0 s.
            </p>
            <p className="mt-2 text-sm text-neutral-300">
              We choose units so that the numbers stay convenient. Very large
              or very small lengths are written using prefixes like{" "}
              <span className="font-semibold">cm, mm, μm, nm, fm</span>.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-neutral-300">
              <li>
                • Fundamental quantities in mechanics: length (L), mass (M),
                time (T)
              </li>
              <li>• SI base units: metre (m), kilogram (kg), second (s)</li>
              <li>• Example: speed = 10 m/s → number 10, unit m/s</li>
            </ul>
            <div className="mt-3 rounded-2xl bg-neutral-900/80 p-3 text-xs text-neutral-200">
              <div className="font-semibold text-sky-300">
                What to observe
              </div>
              <p className="mt-1">
                Move the scale slider and watch how the{" "}
                <span className="font-semibold text-emerald-300">
                  same physical length
                </span>{" "}
                can be written using different units. The object we associate
                with that scale also changes.
              </p>
              <p className="mt-2 font-semibold text-emerald-300">
                Key takeaway: Choice of unit depends on the size of the
                quantity we want to describe.
              </p>
            </div>
          </div>

          {/* Interactive scale explorer */}
          <div className="rounded-2xl border border-sky-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4">
            <div className="flex items-center justify-between text-xs text-sky-200">
              <div className="font-semibold">Scale &amp; Units Explorer</div>
              <div className="font-mono text-[11px] text-sky-300">
                1 fm = 10⁻¹⁵ m
              </div>
            </div>
            <div className="mt-4 text-[11px] text-neutral-300">
              Choose a length scale from everyday size down to nuclear size.
            </div>

            <div className="mt-3">
              <input
                type="range"
                min={-15}
                max={0}
                step={1}
                value={scalePower}
                onChange={(e) => setScalePower(Number(e.target.value))}
                className="w-full accent-sky-400"
              />
              <div className="mt-1 flex justify-between text-[11px] text-neutral-400">
                <span>10⁻¹⁵ m (nucleus)</span>
                <span>10⁰ m (human)</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-xs text-neutral-100 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-900/80 p-3">
                <div className="text-[11px] font-semibold text-sky-200">
                  Current scale
                </div>
                <p className="mt-1 font-mono text-[11px] text-sky-100">
                  Length ≈ {formatPowerOfTen(scalePower)}
                </p>
                <p className="mt-1 font-mono text-[11px] text-emerald-200">
                  ≈ {scaleInfo.displayValue} {scaleInfo.unit}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/80 p-3">
                <div className="text-[11px] font-semibold text-sky-200">
                  Typical object
                </div>
                <p className="mt-1 text-[11px] text-neutral-100">
                  {scaleInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* SECTION 3 – Measurement, Accuracy & Errors */}
      <AccordionSection
        id="measurement-accuracy-errors"
        title="3. Measurement, Accuracy, Precision & Errors"
        openId={openId}
        setOpenId={setOpenId}
        borderGlowClass="border-neutral-800 shadow-emerald-900/40 hover:border-emerald-500/60"
      >
        <div className="mt-1 grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div>
            <p className="text-sm text-neutral-200">
              A measurement compares a quantity with a{" "}
              <span className="font-semibold text-emerald-300">
                chosen standard
              </span>{" "}
              (unit + instrument).
            </p>
            <ul className="mt-2 space-y-1 text-xs text-neutral-300">
              <li>
                • <span className="font-semibold">Accuracy</span> – how close
                the measurement is to the true value.
              </li>
              <li>
                • <span className="font-semibold">Precision</span> – how finely
                we can read the instrument (least count) and how repeatable
                readings are.
              </li>
              <li>
                • <span className="font-semibold">Absolute error</span> = |
                measured − true|.
              </li>
              <li>
                • <span className="font-semibold">% error</span> = (absolute
                error / true) × 100%.
              </li>
            </ul>
            <p className="mt-2 text-xs text-neutral-300">
              Significant figures show how many digits in a measurement are
              considered reliable.
            </p>
            <div className="mt-3 rounded-2xl bg-neutral-900/80 p-3 text-xs text-neutral-200">
              <div className="font-semibold text-sky-300">
                What to observe
              </div>
              <p className="mt-1">
                Try changing the least count and the reading. See how a coarse
                instrument can never reach the exact true value and leads to
                larger percentage error.
              </p>
              <p className="mt-2 font-semibold text-emerald-300">
                Key takeaway: Every measurement has an uncertainty; better
                instruments reduce (but never remove) error.
              </p>
            </div>
          </div>

          {/* Measurement simulator */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4">
            <div className="flex items-center justify-between text-xs text-emerald-100">
              <div className="font-semibold">
                Measurement Simulator – Length of a rod
              </div>
              <div className="font-mono text-[11px]">
                True length = {trueLengthCm.toFixed(1)} cm
              </div>
            </div>

            <div className="mt-3 space-y-3 text-xs text-neutral-100">
              <div>
                <div className="mb-1 text-[11px] text-neutral-300">
                  Instrument least count (smallest division)
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.1}
                  value={leastCount}
                  onChange={(e) =>
                    setLeastCount(Number(e.target.value) || 0.1)
                  }
                  className="w-full accent-emerald-400"
                />
                <div className="mt-1 flex justify-between text-[11px] text-neutral-400">
                  <span>0.1 cm (very fine)</span>
                  <span>1.0 cm (coarse)</span>
                </div>
              </div>

              <div>
                <div className="mb-1 text-[11px] text-neutral-300">
                  Measured reading (snapped to least count)
                </div>
                <input
                  type="range"
                  min={11}
                  max={13}
                  step={leastCount}
                  value={measuredLength}
                  onChange={(e) => setMeasuredLength(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-900/80 p-3">
                  <div className="text-[11px] font-semibold text-emerald-200">
                    Reading vs true
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-neutral-100">
                    Measured = {measuredLength.toFixed(2)} cm
                    <br />
                    True = {trueLengthCm.toFixed(2)} cm
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-3">
                  <div className="text-[11px] font-semibold text-emerald-200">
                    Error
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-neutral-100">
                    Absolute error ={" "}
                    {Math.abs(measurementStats.absoluteError).toFixed(2)} cm
                    <br />
                    % error ≈ {measurementStats.percentageError.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* SECTION 4 – Dimensional Analysis */}
      <AccordionSection
        id="dimensional-analysis"
        title="4. Dimensional Analysis – Equation Checker"
        openId={openId}
        setOpenId={setOpenId}
        borderGlowClass="border-neutral-800 shadow-violet-900/40 hover:border-violet-500/60"
      >
        <div className="mt-1 grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div>
            <p className="text-sm text-neutral-200">
              Each physical quantity can be written in terms of{" "}
              <span className="font-semibold text-violet-300">
                fundamental dimensions
              </span>{" "}
              such as mass [M], length [L], and time [T].
            </p>
            <p className="mt-2 text-sm text-neutral-300">
              In any correct equation, the{" "}
              <span className="font-semibold">
                dimensions of all terms on the left and right
              </span>{" "}
              must be the same. This is called the principle of homogeneity.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-neutral-300">
              <li>• [velocity] = [L T⁻¹]</li>
              <li>• [acceleration] = [L T⁻²]</li>
              <li>• [force] = [M L T⁻²]</li>
            </ul>
            <div className="mt-3 rounded-2xl bg-neutral-900/80 p-3 text-xs text-neutral-200">
              <div className="font-semibold text-sky-300">
                What to observe
              </div>
              <p className="mt-1">
                Try the common formulas below. For a valid relation, dimensions
                of both sides match. A dimensionally correct formula may still
                be numerically wrong, but an incorrect one is certainly wrong.
              </p>
              <p className="mt-2 font-semibold text-emerald-300">
                Key takeaway: Dimensional analysis is a quick test for the
                possible correctness of an equation.
              </p>
            </div>
          </div>

          {/* Dimensional checker tool */}
          <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4">
            <div className="text-xs font-semibold text-violet-100">
              Equation dimensional checker
            </div>

            <div className="mt-3 space-y-2 text-[11px] text-neutral-100">
              <label className="block text-neutral-300">
                Type a simple formula (use *, /, sqrt). Example:{" "}
                <span className="font-mono text-sky-300">v = u + at</span>
              </label>
              <input
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] font-mono text-neutral-50 focus:border-violet-400 focus:outline-none"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFormulaInput("v = u + at")}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-neutral-200 hover:border-violet-400"
                >
                  v = u + at
                </button>
                <button
                  type="button"
                  onClick={() => setFormulaInput("F = m a")}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-neutral-200 hover:border-violet-400"
                >
                  F = m a
                </button>
                <button
                  type="button"
                  onClick={() => setFormulaInput("T = 2π√(l/g)")}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-neutral-200 hover:border-violet-400"
                >
                  T = 2π√(l/g)
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-900/80 p-3">
                  <div className="text-[11px] font-semibold text-violet-200">
                    Dimensions
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-neutral-100">
                    LHS: {dimensionalResult.lhs}
                    <br />
                    RHS: {dimensionalResult.rhs}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-3">
                  <div className="text-[11px] font-semibold text-violet-200">
                    Verdict
                  </div>
                  <p
                    className={`mt-1 text-[11px] font-semibold ${
                      dimensionalResult.correct
                        ? "text-emerald-300"
                        : "text-amber-300"
                    }`}
                  >
                    {dimensionalResult.correct
                      ? "Dimensionally correct"
                      : "Cannot confirm – formula not recognised here"}
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-200">
                    {dimensionalResult.note}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
};

export default PhysicalWorldMeasurementChapterContent;

