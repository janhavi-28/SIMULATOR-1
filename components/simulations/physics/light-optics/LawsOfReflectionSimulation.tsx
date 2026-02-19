"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const degToRad = (d: number) => (d * Math.PI) / 180;

const STEPS = [
  { id: "incident" as const, label: "Observe incident ray" },
  { id: "reflect" as const, label: "Observe reflected ray" },
  { id: "compare" as const, label: "Compare angles" },
  { id: "conclusion" as const, label: "Conclusion" },
];

const PRESETS = [
  { id: "small", label: "Small Angle", angle: 15 },
  { id: "medium", label: "Medium Angle", angle: 40 },
  { id: "large", label: "Large Angle", angle: 65 },
  { id: "grazing", label: "Grazing Angle", angle: 85 },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const TRANSITION_MS = 280;

export default function LawsOfReflectionSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [incidentAngleDeg, setIncidentAngleDeg] = useState(40);
  const [step, setStep] = useState<StepId>("incident");
  const [phase, setPhase] = useState(0);
  const [insightOpen, setInsightOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"concept" | "experiment">("concept");
  const [visibleLabel, setVisibleLabel] = useState<string | null>(null);
  const [equationKey, setEquationKey] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const lastTsRef = useRef<number | null>(null);
  const labelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const i = incidentAngleDeg;
  const r = incidentAngleDeg; // Law of reflection: i = r (physics unchanged)

  useEffect(() => {
    setEquationKey((k) => k + 1);
  }, [incidentAngleDeg]);

  const showLabel = useCallback((id: string) => {
    if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
    setVisibleLabel(id);
    labelTimeoutRef.current = setTimeout(() => setVisibleLabel(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
    };
  }, []);

  const advanceStep = useCallback(() => {
    setStep((s) => {
      const idx = STEPS.findIndex((x) => x.id === s);
      setCompletedSteps((prev) => new Set(prev).add(s));
      if (idx < STEPS.length - 1) return STEPS[idx + 1].id;
      return s;
    });
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      setPhase((p) => p + dt * (hasLaunched && !paused ? 1.5 : 0.2));
    };
    raf = requestAnimationFrame((ts) => {
      lastTsRef.current = ts;
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused]);

  const launch = () => {
    setPaused(false);
    setHasLaunched(true);
    setStep("incident");
    setCompletedSteps(new Set());
  };
  const reset = () => {
    setPaused(true);
    setHasLaunched(false);
    setStep("incident");
    setCompletedSteps(new Set());
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setIncidentAngleDeg(preset.angle);
  };

  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const dpr = canvas.width / (containerRef.current?.getBoundingClientRect().width || 1);
    const cx = w / 2;
    const cy = h / 2;
    const mirrorY = cy;
    const mirrorLen = w * 0.65;
    const rayLen = Math.min(w, h) * 0.34;
    const theta = degToRad(incidentAngleDeg);
    const hitX = cx;
    const hitY = mirrorY;
    const t = (phase * 0.4) % 1;
    const shimmer = 0.75 + 0.25 * Math.sin(phase * 2);
    const pulseRefl = step === "reflect" || step === "compare" || step === "conclusion" ? 0.9 + 0.1 * Math.sin(phase * 4) : 1;

    ctx.clearRect(0, 0, w, h);

    const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.8);
    rad.addColorStop(0, "#0f2a3d");
    rad.addColorStop(0.5, "#0a1628");
    rad.addColorStop(0.85, "#020617");
    rad.addColorStop(1, "#020617");
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 16; i++) {
      const x = (w * (0.15 + 0.7 * (i / 15))) + 12 * Math.sin(phase + i * 0.5);
      const y = mirrorY + (i % 2 === 0 ? -6 : 6) + 5 * Math.cos(phase * 1.2 + i);
      if (y > 0 && y < h) {
        ctx.fillStyle = `rgba(148,163,184,${0.06 + 0.05 * Math.sin(phase + i)})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const mirrorTop = mirrorY - 6 * dpr;
    const mirrorBottom = mirrorY + 6 * dpr;
    const mirrorGrad = ctx.createLinearGradient(0, mirrorTop, 0, mirrorBottom);
    mirrorGrad.addColorStop(0, "rgba(34,211,238,0.08)");
    mirrorGrad.addColorStop(0.3, "rgba(34,211,238,0.2)");
    mirrorGrad.addColorStop(0.5, "rgba(56,189,248,0.35)");
    mirrorGrad.addColorStop(0.7, "rgba(34,211,238,0.2)");
    mirrorGrad.addColorStop(1, "rgba(34,211,238,0.08)");
    ctx.fillStyle = mirrorGrad;
    ctx.fillRect(cx - mirrorLen / 2, mirrorTop, mirrorLen, mirrorBottom - mirrorTop);
    ctx.strokeStyle = `rgba(56,189,248,${0.5 + 0.15 * Math.sin(phase * 2)})`;
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx - mirrorLen / 2, mirrorY);
    ctx.lineTo(cx + mirrorLen / 2, mirrorY);
    ctx.stroke();

    const impactGlow = ctx.createRadialGradient(hitX, hitY, 0, hitX, hitY, 40 * dpr);
    impactGlow.addColorStop(0, "rgba(254,240,138,0.3)");
    impactGlow.addColorStop(0.4, "rgba(103,232,249,0.15)");
    impactGlow.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = impactGlow;
    ctx.fillRect(hitX - 40 * dpr, hitY - 40 * dpr, 80 * dpr, 80 * dpr);

    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.setLineDash([6 * dpr, 5 * dpr]);
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(hitX, hitY - 55 * dpr);
    ctx.lineTo(hitX, hitY + 55 * dpr);
    ctx.stroke();
    ctx.setLineDash([]);

    const incAlpha = step === "incident" || step === "reflect" || step === "compare" || step === "conclusion" ? 1 : 0.45;
    const incStartX = hitX - Math.sin(theta) * rayLen;
    const incStartY = hitY - Math.cos(theta) * rayLen;
    const incGrad = ctx.createLinearGradient(incStartX, incStartY, hitX, hitY);
    incGrad.addColorStop(0, `rgba(254,240,138,${0.5 * shimmer})`);
    incGrad.addColorStop(0.5, "rgba(251,191,36,0.95)");
    incGrad.addColorStop(1, "rgba(254,240,138,0.95)");
    ctx.shadowColor = "rgba(254,240,138,0.6)";
    ctx.shadowBlur = 10 * dpr;
    ctx.strokeStyle = incGrad;
    ctx.lineWidth = 2.8 * dpr;
    ctx.beginPath();
    ctx.moveTo(incStartX, incStartY);
    ctx.lineTo(hitX, hitY);
    ctx.stroke();
    const photonX = incStartX + (hitX - incStartX) * t;
    const photonY = incStartY + (hitY - incStartY) * t;
    ctx.fillStyle = "rgba(254,240,138,0.95)";
    ctx.beginPath();
    ctx.arc(photonX, photonY, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const reflAlpha = step === "reflect" || step === "compare" || step === "conclusion" ? 1 : 0.4;
    const reflEndX = hitX + Math.sin(theta) * rayLen;
    const reflEndY = hitY - Math.cos(theta) * rayLen;
    const reflGrad = ctx.createLinearGradient(hitX, hitY, reflEndX, reflEndY);
    reflGrad.addColorStop(0, "rgba(103,232,249,0.95)");
    reflGrad.addColorStop(0.5, "rgba(34,211,238,0.95)");
    reflGrad.addColorStop(1, `rgba(103,232,249,${0.6 * pulseRefl * reflAlpha})`);
    ctx.shadowColor = "rgba(103,232,249,0.55)";
    ctx.shadowBlur = step === "reflect" || step === "compare" ? 12 * dpr : 8 * dpr;
    ctx.strokeStyle = reflGrad;
    ctx.globalAlpha = reflAlpha;
    ctx.lineWidth = 2.8 * dpr;
    ctx.beginPath();
    ctx.moveTo(hitX, hitY);
    ctx.lineTo(reflEndX, reflEndY);
    ctx.stroke();
    const photonReflT = (t + 0.5) % 1;
    const photonReflX = hitX + (reflEndX - hitX) * photonReflT;
    const photonReflY = hitY + (reflEndY - hitY) * photonReflT;
    ctx.fillStyle = "rgba(103,232,249,0.95)";
    ctx.beginPath();
    ctx.arc(photonReflX, photonReflY, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    const arcR = 28 * dpr;
    const arcGlow = step === "compare" || step === "conclusion";
    if (arcGlow) {
      ctx.shadowColor = "rgba(34,197,94,0.5)";
      ctx.shadowBlur = 8 * dpr;
    }
    ctx.strokeStyle = arcGlow ? "rgba(34,197,94,0.9)" : "rgba(251,191,36,0.9)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(hitX, hitY, arcR, -theta, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(226,232,240,0.95)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("i", hitX - arcR * 0.7, hitY - arcR * 0.4);
    ctx.beginPath();
    ctx.arc(hitX, hitY, arcR, 0, theta);
    ctx.stroke();
    ctx.fillText("r", hitX + arcR * 0.7, hitY - arcR * 0.4);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.font = `${11 * dpr}px system-ui`;
    ctx.fillText("i = r (Laws of Reflection)", cx, mirrorY + 62);
  }, [incidentAngleDeg, step, phase]);

  const trackStyle = { background: "linear-gradient(90deg, #facc15, #fb923c)" };

  return (
    <div
      className="reflection-premium flex flex-col w-full max-w-[1600px] mx-auto px-[clamp(16px,3vw,32px)]"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-white" style={{ letterSpacing: "-0.01em" }}>
            Laws of Reflection
          </h1>
          <p className="text-sm opacity-70 text-neutral-300 mt-0.5">
            Angle of incidence equals angle of reflection. See i = r.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap" style={{ transition: `all ${TRANSITION_MS}ms ${EASE}` }}>
          <div
            key={equationKey}
            className="rounded-xl border border-white/10 px-4 py-2.5 font-mono text-sm shadow-[0_0_20px_-4px_rgba(34,197,94,0.35)]"
            style={{
              background: "rgba(34,197,94,0.12)",
              color: "rgba(134,239,172,0.95)",
              animation: "refraction-glow 1.2s ease-out",
              transition: `all ${TRANSITION_MS}ms ${EASE}`,
            }}
          >
            Law of Reflection → i = r → {i}° = {r}°
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={launch}
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-[180ms] ease-out hover:-translate-y-0.5 active:translate-y-0 border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Launch simulation"
            >
              Launch
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-[180ms] ease-out hover:-translate-y-0.5 active:translate-y-0 bg-cyan-500 text-slate-950 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label={paused ? "Play" : "Pause"}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-neutral-600 bg-neutral-800/80 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-[180ms] ease-out focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Reset"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <section className="reflection-premium-grid grid gap-6 w-full min-h-[600px] lg:min-h-[680px] xl:min-h-[720px]">
        <div
          className="relative rounded-[22px] overflow-hidden"
          style={{
            background: "radial-gradient(circle at center, #0f2a3d 0%, #020617 85%)",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.7)",
          }}
        >
          <div
            ref={containerRef}
            className="relative w-full h-full min-h-[520px] lg:min-h-[600px] xl:min-h-[640px]"
            style={{ transition: `all ${TRANSITION_MS}ms ${EASE}` }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full block object-contain pointer-events-none"
              style={{ width: "100%", height: "100%" }}
              aria-hidden
            />
            <div className="absolute inset-0 pointer-events-none">
              <span
                className={`absolute text-[11px] font-medium uppercase tracking-widest px-2 py-1 rounded transition-all duration-300 ${visibleLabel === "incident" ? "opacity-100 text-amber-300/95" : "opacity-0"}`}
                style={{ left: "22%", top: "28%" }}
              >
                Incident Ray
              </span>
              <span
                className={`absolute text-[11px] font-medium uppercase tracking-widest px-2 py-1 rounded transition-all duration-300 ${visibleLabel === "reflected" ? "opacity-100 text-cyan-300/95" : "opacity-0"}`}
                style={{ right: "22%", top: "28%" }}
              >
                Reflected Ray
              </span>
              <span
                className={`absolute text-[11px] font-medium uppercase tracking-widest px-2 py-1 rounded transition-all duration-300 ${visibleLabel === "normal" ? "opacity-100 text-slate-300" : "opacity-0"}`}
                style={{ left: "50%", top: "46%", transform: "translateX(-50%)" }}
              >
                Normal
              </span>
              <span
                className={`absolute text-[11px] font-medium uppercase tracking-widest px-2 py-1 rounded transition-all duration-300 ${visibleLabel === "mirror" ? "opacity-100 text-cyan-300/95" : "opacity-0"}`}
                style={{ left: "50%", top: "52%", transform: "translate(-50%,-50%)" }}
              >
                Mirror Surface
              </span>
            </div>
            <div className="absolute inset-0 pointer-events-auto" aria-hidden>
              <button type="button" className="absolute w-[100px] h-10 left-[18%] top-[24%]" onMouseEnter={() => showLabel("incident")} />
              <button type="button" className="absolute w-[100px] h-10 right-[18%] top-[24%]" onMouseEnter={() => showLabel("reflected")} />
              <button type="button" className="absolute w-12 h-16 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" onMouseEnter={() => showLabel("normal")} />
              <button type="button" className="absolute left-[15%] right-[15%] h-6 top-1/2 -translate-y-1/2" onMouseEnter={() => showLabel("mirror")} />
            </div>
          </div>
        </div>

        <aside
          className="rounded-[18px] flex flex-col gap-5 p-5 min-w-0"
          style={{
            backdropFilter: "blur(18px)",
            background: "rgba(15,23,42,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
            transition: `all ${TRANSITION_MS}ms ${EASE}`,
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium opacity-60">Try examples</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-[180ms] ease-out focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium opacity-60">Angle control</p>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-300">Angle of incidence i</label>
              <datalist id="reflection-angle-ticks">
                {[10, 25, 40, 55, 70, 80].map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="relative pt-6">
                <input
                  type="range"
                  list="reflection-angle-ticks"
                  min={10}
                  max={80}
                  step={1}
                  value={incidentAngleDeg}
                  onChange={(e) => setIncidentAngleDeg(Number(e.target.value))}
                  className="w-full h-2.5 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-amber-500/50 [&::-webkit-slider-thumb]:shadow-lg"
                  style={{
                    ...trackStyle,
                    WebkitAppearance: "none",
                    height: 10,
                    borderRadius: 5,
                  }}
                  aria-label="Angle of incidence in degrees"
                  aria-valuemin={10}
                  aria-valuemax={80}
                  aria-valuenow={incidentAngleDeg}
                />
                <span className="absolute -top-0.5 left-0 right-0 text-center text-sm font-mono text-amber-300/95">
                  {incidentAngleDeg}°
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium opacity-60">Learning mode</p>
            <div className="flex flex-col gap-1.5">
              {STEPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`rounded-lg px-3 py-2.5 text-left text-xs font-medium border transition-all duration-[180ms] ease-out hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 ${
                    step === s.id
                      ? "border-cyan-400 bg-cyan-500/20 text-white"
                      : "border-neutral-600 bg-neutral-800/60 text-neutral-400 hover:border-neutral-500"
                  }`}
                >
                  {completedSteps.has(s.id) && (
                    <span className="text-emerald-400 shrink-0" aria-hidden>✓</span>
                  )}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={advanceStep}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-all duration-[180ms] ease-out hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Next step →
            </button>
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 mt-auto">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium opacity-60">Result</p>
            <p className="text-sm text-neutral-200">
              i = <span className="font-mono font-semibold text-amber-300">{i}°</span>
              {" "}= r = <span className="font-mono font-semibold text-cyan-300">{r}°</span>
            </p>
            <p className="text-xs text-emerald-400/90 font-medium">Angles are equal (law of reflection)</p>
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-[18px] border border-white/10 overflow-hidden" style={{ background: "rgba(15,23,42,0.5)" }}>
        <button
          type="button"
          onClick={() => setInsightOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500/50"
          aria-expanded={insightOpen}
          aria-controls="reflection-insight-content"
        >
          <span className="text-base font-semibold text-white">Why does reflection obey i = r?</span>
          <span className="text-neutral-400 text-sm" aria-hidden>{insightOpen ? "−" : "+"}</span>
        </button>
        <div
          id="reflection-insight-content"
          role="region"
          className={`overflow-hidden transition-all duration-300 ${insightOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
          style={{ transitionProperty: "max-height, opacity" }}
        >
          <p className="px-5 pb-5 text-sm leading-relaxed text-cyan-300/95">
            The mirror surface forces light to bounce symmetrically relative to the normal. At {i}°, both i and r are {r}° — the path is reversible and the ray obeys the law of reflection for any angle.
          </p>
        </div>
      </section>

      <div className="mt-4 flex border-b border-white/10" role="tablist" aria-label="Concept and Experiment tabs">
        <button
          type="button"
          onClick={() => setActiveTab("concept")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
            activeTab === "concept" ? "text-cyan-400 border-b-2 border-cyan-500" : "text-neutral-400 hover:text-neutral-200"
          }`}
          aria-selected={activeTab === "concept"}
          role="tab"
          aria-controls="reflection-panel-concept"
          id="reflection-tab-concept"
        >
          Concept
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("experiment")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
            activeTab === "experiment" ? "text-cyan-400 border-b-2 border-cyan-500" : "text-neutral-400 hover:text-neutral-200"
          }`}
          aria-selected={activeTab === "experiment"}
          role="tab"
          aria-controls="reflection-panel-experiment"
          id="reflection-tab-experiment"
        >
          Experiment
        </button>
      </div>
      <div
        role="tabpanel"
        id="reflection-panel-concept"
        aria-labelledby="reflection-tab-concept"
        className="py-4 text-sm text-neutral-300 leading-relaxed"
        hidden={activeTab !== "concept"}
      >
        The law of reflection states that the angle of incidence i equals the angle of reflection r, both measured from the normal to the surface. The incident ray, normal, and reflected ray lie in the same plane. This holds for any smooth reflective surface.
      </div>
      <div
        role="tabpanel"
        id="reflection-panel-experiment"
        aria-labelledby="reflection-tab-experiment"
        className="py-4 text-sm text-neutral-300 leading-relaxed"
        hidden={activeTab !== "experiment"}
      >
        Use the angle slider to change the incident ray; the reflected ray updates so that i = r. Try the presets (Small, Medium, Large, Grazing) to see how the geometry changes. Step through the learning mode to observe the incident ray, reflected ray, and equal angles in order.
      </div>
    </div>
  );
}
