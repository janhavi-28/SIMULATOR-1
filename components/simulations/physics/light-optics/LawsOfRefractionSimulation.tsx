"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const degToRad = (d: number) => (d * Math.PI) / 180;
const radToDeg = (r: number) => (r * 180) / Math.PI;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function snell(n1: number, n2: number, theta1Deg: number): { theta2Deg: number; tir: boolean } {
  const s2 = (n1 / n2) * Math.sin(degToRad(theta1Deg));
  if (s2 >= 1) return { theta2Deg: 90, tir: true };
  if (s2 <= -1) return { theta2Deg: -90, tir: true };
  return { theta2Deg: radToDeg(Math.asin(s2)), tir: false };
}

function criticalAngle(n1: number, n2: number): number {
  if (n2 >= n1) return 90;
  return radToDeg(Math.asin(n2 / n1));
}

const PRESETS = [
  { id: "air-glass", label: "Air → Glass", n1: 1, n2: 1.5, angle: 40 },
  { id: "glass-air", label: "Glass → Air", n1: 1.5, n2: 1, angle: 30 },
  { id: "high", label: "High Refraction", n1: 1, n2: 1.6, angle: 50 },
  { id: "near-critical", label: "Near Critical Angle", n1: 1.5, n2: 1, angle: 41 },
] as const;

const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const TRANSITION_MS = 250;
const LERP_SPEED = 0.12; // ~250ms to settle at 60fps

function getInsightText(tir: boolean, n1: number, n2: number, angle: number): string {
  if (tir) return "Total internal reflection: angle exceeds the critical angle, so no light enters the second medium.";
  if (n2 > n1) return "Light slows in the denser medium (n₂ > n₁), so the ray bends toward the normal.";
  if (n1 > n2) return "Light speeds up in the less dense medium (n₂ < n₁), so the ray bends away from the normal.";
  return "Equal indices: no bending. The ray continues straight across the boundary.";
}

function getFloatingTooltip(tir: boolean, n1: number, n2: number, prevAngle: number, angle: number): string | null {
  if (angle > prevAngle) return "Angle increased → refraction increases";
  if (angle < prevAngle) return "Angle decreased → refraction decreases";
  if (n2 > n1 && !tir) return "n₂ > n₁ → ray bends toward normal";
  if (n1 > n2 && !tir) return "n₂ < n₁ → ray bends away from normal";
  if (tir) return "Beyond critical angle → total internal reflection";
  return null;
}

// Deterministic particle positions from seed
function getParticles(w: number, h: number, count: number) {
  const particles: { x: number; y: number; vx: number; vy: number; size: number; layer: number }[] = [];
  for (let i = 0; i < count; i++) {
    const seed = (i * 1.618) % 1;
    particles.push({
      x: (seed * 0.6 + 0.2) * w,
      y: ((1 - seed * 0.7) % 1) * h,
      vx: 0.08 + (i % 5) * 0.02,
      vy: 0.03 + (i % 3) * 0.02,
      size: 0.8 + (i % 3) * 0.4,
      layer: (i % 3) * 0.33,
    });
  }
  return particles;
}

export default function LawsOfRefractionSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [phase, setPhase] = useState(0);
  const [incidentAngleDeg, setIncidentAngleDeg] = useState(40);
  const [n1, setN1] = useState(1);
  const [n2, setN2] = useState(1.5);
  const [showTIR, setShowTIR] = useState(false);
  const [insightOpen, setInsightOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"concept" | "experiment">("concept");
  const [visibleLabel, setVisibleLabel] = useState<string | null>(null);
  const [equationKey, setEquationKey] = useState(0);
  const [floatingTooltip, setFloatingTooltip] = useState<string | null>(null);
  const [impactActive, setImpactActive] = useState(false);
  const lastTsRef = useRef<number | null>(null);
  const labelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const impactEndRef = useRef<number>(0);
  const prevParamsRef = useRef({ angle: incidentAngleDeg, n1, n2 });
  const phaseRef = useRef(0);
  const particlesRef = useRef<ReturnType<typeof getParticles> | null>(null);

  const { theta2Deg, tir } = snell(n1, n2, incidentAngleDeg);
  const critDeg = criticalAngle(Math.max(n1, n2), Math.min(n1, n2));
  const sinI = Math.sin(degToRad(incidentAngleDeg));
  const sinR = tir ? 1 : Math.sin(degToRad(theta2Deg));
  const lhs = n1 * sinI;
  const rhs = tir ? n2 : n2 * sinR;
  const balanced = !tir && Math.abs(lhs - rhs) < 0.01;
  const insightText = getInsightText(tir, n1, n2, incidentAngleDeg);

  const [displayAngle, setDisplayAngle] = useState(incidentAngleDeg);
  const [displayN1, setDisplayN1] = useState(n1);
  const [displayN2, setDisplayN2] = useState(n2);
  const [displayTheta2, setDisplayTheta2] = useState(tir ? 90 : theta2Deg);
  const [displaySinI, setDisplaySinI] = useState(sinI);
  const [displaySinR, setDisplaySinR] = useState(sinR);

  useEffect(() => {
    setEquationKey((k) => k + 1);
  }, [incidentAngleDeg, n1, n2, theta2Deg, tir]);

  useEffect(() => {
    const prev = prevParamsRef.current;
    const msg = getFloatingTooltip(tir, n1, n2, prev.angle, incidentAngleDeg);
    if (msg && (prev.angle !== incidentAngleDeg || prev.n1 !== n1 || prev.n2 !== n2)) {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      setFloatingTooltip(msg);
      tooltipTimeoutRef.current = setTimeout(() => setFloatingTooltip(null), 3200);
    }
    prevParamsRef.current = { angle: incidentAngleDeg, n1, n2 };
  }, [incidentAngleDeg, n1, n2, tir]);

  const showLabel = useCallback((id: string) => {
    if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
    setVisibleLabel(id);
    labelTimeoutRef.current = setTimeout(() => setVisibleLabel(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      const speed = hasLaunched && !paused ? 1.2 : 0.25;
      setPhase((p) => {
        const next = p + dt * speed;
        phaseRef.current = next;
        if (Math.floor(next * 0.5) > Math.floor(p * 0.5) && hasLaunched && !paused) {
          setImpactActive(true);
          impactEndRef.current = ts + 200;
        }
        return next;
      });
      setDisplayAngle((a) => (Math.abs(a - incidentAngleDeg) < 0.3 ? incidentAngleDeg : lerp(a, incidentAngleDeg, LERP_SPEED)));
      setDisplayN1((a) => (Math.abs(a - n1) < 0.005 ? n1 : lerp(a, n1, LERP_SPEED)));
      setDisplayN2((a) => (Math.abs(a - n2) < 0.005 ? n2 : lerp(a, n2, LERP_SPEED)));
      const targetTheta = tir ? 90 : theta2Deg;
      setDisplayTheta2((a) => (Math.abs(a - targetTheta) < 0.3 ? targetTheta : lerp(a, targetTheta, LERP_SPEED)));
      setDisplaySinI((a) => (Math.abs(a - sinI) < 0.002 ? sinI : lerp(a, sinI, LERP_SPEED)));
      setDisplaySinR((a) => (Math.abs(a - sinR) < 0.002 ? sinR : lerp(a, sinR, LERP_SPEED)));
      if (impactActive && ts >= impactEndRef.current) setImpactActive(false);
    };
    raf = requestAnimationFrame((ts) => {
      lastTsRef.current = ts;
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused, incidentAngleDeg, n1, n2, theta2Deg, tir, sinI, sinR, impactActive]);

  const launch = () => {
    setPaused(false);
    setHasLaunched(true);
  };
  const reset = () => {
    setPaused(true);
    setHasLaunched(false);
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setN1(preset.n1);
    setN2(preset.n2);
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
    const boundaryY = cy;
    const rayLen = Math.min(w, h) * 0.36;
    const theta1 = degToRad(incidentAngleDeg);
    const theta2 = degToRad(theta2Deg);
    const hitX = cx;
    const t = (phase * 0.5) % 1;
    const energyPulse = 0.88 + 0.14 * Math.sin(phase * 2.5);
    const boundaryShimmer = 0.55 + 0.35 * Math.sin(phase * 2.8);
    const flowOffset = (phase * 0.3) % 1;

    if (!particlesRef.current) particlesRef.current = getParticles(w, h, 55);

    ctx.clearRect(0, 0, w, h);

    // —— Layer 1: Background atmosphere (radial at 40% 30%) ——
    const radX = w * 0.4;
    const radY = h * 0.3;
    const rad = ctx.createRadialGradient(radX, radY, 0, radX, radY, Math.max(w, h) * 0.9);
    rad.addColorStop(0, "#1e3a5f");
    rad.addColorStop(0.4, "#0f172a");
    rad.addColorStop(0.7, "#020617");
    rad.addColorStop(1, "#020617");
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, w, h);

    // —— Layer 2: Subtle grid parallax ——
    const gridOpacity = 0.04 + 0.02 * Math.sin(phase * 0.5);
    ctx.strokeStyle = `rgba(148,163,184,${gridOpacity})`;
    ctx.lineWidth = 0.5 * dpr;
    const gridStep = 40 * dpr;
    const gridOffsetX = (phase * 8) % gridStep;
    const gridOffsetY = (phase * 5) % gridStep;
    for (let x = -gridOffsetX; x < w + gridStep; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = -gridOffsetY; y < h + gridStep; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // —— Layer 2b: Particle field (slow drift, parallax, opacity 0.15) ——
    const particles = particlesRef.current;
    particles.forEach((p, i) => {
      const px = (p.x + p.vx * phase * 20 + Math.sin(phase * 0.7 + i) * 12) % (w + 40) - 20;
      const py = (p.y + p.vy * phase * 15 + Math.cos(phase * 0.5 + i * 0.8) * 8) % (h + 40) - 20;
      const parallax = 1 + p.layer * 0.15;
      const size = p.size * dpr * parallax;
      ctx.fillStyle = `rgba(200,220,255,0.15)`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // —— Layer 3: Medium 1 (top) and Medium 2 (bottom) with distinct tints ——
    const med1 = ctx.createLinearGradient(0, 0, 0, boundaryY);
    med1.addColorStop(0, "rgba(56,189,248,0.08)");
    med1.addColorStop(1, "rgba(56,189,248,0.04)");
    ctx.fillStyle = med1;
    ctx.fillRect(0, 0, w, boundaryY);
    const med2 = ctx.createLinearGradient(0, boundaryY, 0, h);
    med2.addColorStop(0, "rgba(20,184,166,0.06)");
    med2.addColorStop(1, "rgba(20,184,166,0.10)");
    ctx.fillStyle = med2;
    ctx.fillRect(0, boundaryY, w, h - boundaryY);

    // —— Boundary distortion shimmer (line glow + soft bleed) ——
    const bleedGrad = ctx.createLinearGradient(0, boundaryY - 25, 0, boundaryY + 25);
    bleedGrad.addColorStop(0, "rgba(34,211,238,0)");
    bleedGrad.addColorStop(0.4, `rgba(34,211,238,${0.08 * boundaryShimmer})`);
    bleedGrad.addColorStop(0.5, `rgba(34,211,238,${0.18 * boundaryShimmer})`);
    bleedGrad.addColorStop(0.6, `rgba(34,211,238,${0.08 * boundaryShimmer})`);
    bleedGrad.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = bleedGrad;
    ctx.fillRect(0, boundaryY - 25, w, 50);
    ctx.strokeStyle = `rgba(34,211,238,${0.5 + boundaryShimmer * 0.25})`;
    ctx.lineWidth = 2.2 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, boundaryY);
    ctx.lineTo(w, boundaryY);
    ctx.stroke();

    // —— Intersection glow (boundary hit point) ——
    const glowSize = 42 * dpr;
    const hitGrad = ctx.createRadialGradient(hitX, boundaryY, 0, hitX, boundaryY, glowSize);
    hitGrad.addColorStop(0, "rgba(254,240,138,0.28)");
    hitGrad.addColorStop(0.3, "rgba(103,232,249,0.15)");
    hitGrad.addColorStop(0.6, "rgba(34,211,238,0.06)");
    hitGrad.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = hitGrad;
    ctx.fillRect(hitX - glowSize, boundaryY - glowSize, glowSize * 2, glowSize * 2);

    // —— Source emitter (energy node: breathing glow + rotating ring) ——
    const incEndX = hitX - Math.sin(theta1) * rayLen;
    const incEndY = boundaryY - Math.cos(theta1) * rayLen;
    const emitterPulse = 0.85 + 0.2 * Math.sin(phase * 2);
    const ringRadius = 14 * dpr + 2 * Math.sin(phase);
    ctx.save();
    ctx.translate(incEndX, incEndY);
    ctx.shadowColor = "rgba(34,211,238,0.9)";
    ctx.shadowBlur = 22 * emitterPulse;
    ctx.fillStyle = `rgba(125,211,252,${emitterPulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 8 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(167,139,250,${0.4 + 0.2 * Math.sin(phase * 1.5)})`;
    ctx.lineWidth = 1.5 * dpr;
    ctx.rotate(phase * 0.8);
    ctx.setLineDash([4 * dpr, 6 * dpr]);
    ctx.lineDashOffset = flowOffset * 20;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // —— Energy beams: incident ray (gradient #7dd3fc → #22d3ee → #a78bfa, shimmer) ——
    const incGrad = ctx.createLinearGradient(incEndX, incEndY, hitX, boundaryY);
    incGrad.addColorStop(0, `rgba(125,211,252,${0.7 * energyPulse})`);
    incGrad.addColorStop(0.45, `rgba(34,211,238,${0.95 * energyPulse})`);
    incGrad.addColorStop(1, `rgba(167,139,250,${0.9 * energyPulse})`);
    ctx.shadowColor = "rgba(34,211,238,0.7)";
    ctx.shadowBlur = 4 * dpr;
    ctx.strokeStyle = incGrad;
    ctx.lineWidth = 3.2 * dpr;
    ctx.beginPath();
    ctx.moveTo(incEndX, incEndY);
    ctx.lineTo(hitX, boundaryY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    const photonX = incEndX + (hitX - incEndX) * t;
    const photonY = incEndY + (boundaryY - incEndY) * t;
    ctx.fillStyle = "rgba(254,240,138,0.98)";
    ctx.shadowColor = "rgba(254,240,138,0.8)";
    ctx.shadowBlur = 6 * dpr;
    ctx.beginPath();
    ctx.arc(photonX, photonY, 3.5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (!tir) {
      const refrEndX = hitX + Math.sin(theta2) * rayLen;
      const refrEndY = boundaryY + Math.cos(theta2) * rayLen;
      const refrGrad = ctx.createLinearGradient(hitX, boundaryY, refrEndX, refrEndY);
      refrGrad.addColorStop(0, `rgba(34,211,238,${0.95 * energyPulse})`);
      refrGrad.addColorStop(0.5, `rgba(103,232,249,${0.95 * energyPulse})`);
      refrGrad.addColorStop(1, `rgba(167,139,250,${0.75 * energyPulse})`);
      ctx.shadowColor = "rgba(34,211,238,0.6)";
      ctx.shadowBlur = 4 * dpr;
      ctx.strokeStyle = refrGrad;
      ctx.lineWidth = 3.2 * dpr;
      ctx.beginPath();
      ctx.moveTo(hitX, boundaryY);
      ctx.lineTo(refrEndX, refrEndY);
      ctx.stroke();
      ctx.shadowBlur = 0;
      const ang = Math.atan2(refrEndY - boundaryY, refrEndX - hitX);
      const arr = 10 * dpr;
      ctx.fillStyle = "rgba(167,139,250,0.95)";
      ctx.beginPath();
      ctx.moveTo(refrEndX, refrEndY);
      ctx.lineTo(refrEndX - arr * Math.cos(ang - 0.35), refrEndY - arr * Math.sin(ang - 0.35));
      ctx.lineTo(refrEndX - arr * Math.cos(ang + 0.35), refrEndY - arr * Math.sin(ang + 0.35));
      ctx.closePath();
      ctx.fill();
    } else if (tir && showTIR) {
      const reflEndX = hitX + Math.sin(theta1) * rayLen;
      const reflEndY = boundaryY - Math.cos(theta1) * rayLen;
      ctx.strokeStyle = "rgba(248,113,113,0.9)";
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.lineDashOffset = -phase * 12;
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(hitX, boundaryY);
      ctx.lineTo(reflEndX, reflEndY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(248,113,113,0.95)";
      ctx.font = `${12 * dpr}px system-ui`;
      ctx.fillText("Total Internal Reflection", hitX + 24, boundaryY - 32);
    }

    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.fillText(`n₁ = ${n1.toFixed(2)}`, 22, boundaryY - 18);
    ctx.fillText(`n₂ = ${n2.toFixed(2)}`, 22, boundaryY + 24);

    const barW = 90 * dpr;
    const barH = 10 * dpr;
    const leftBarX = cx - barW - 35 * dpr;
    const rightBarX = cx + 35 * dpr;
    const barY = boundaryY + 48 * dpr;
    const maxSin = 1;
    const animT = 0.7 + 0.3 * Math.sin(phase);
    const leftFill = (displaySinI / maxSin) * animT;
    const rightFill = (displaySinR / maxSin) * animT;
    ctx.fillStyle = "rgba(71,85,105,0.5)";
    ctx.fillRect(leftBarX, barY, barW, barH);
    ctx.fillRect(rightBarX, barY, barW, barH);
    const leftGrad = ctx.createLinearGradient(leftBarX, barY, leftBarX + barW, barY);
    leftGrad.addColorStop(0, "rgba(251,191,36,0.9)");
    leftGrad.addColorStop(1, "rgba(234,179,8,0.9)");
    ctx.fillStyle = leftGrad;
    ctx.fillRect(leftBarX, barY, barW * Math.min(1, leftFill), barH);
    const rightGrad = ctx.createLinearGradient(rightBarX, barY, rightBarX + barW, barY);
    rightGrad.addColorStop(0, "rgba(103,232,249,0.9)");
    rightGrad.addColorStop(1, "rgba(34,211,238,0.9)");
    ctx.fillStyle = rightGrad;
    ctx.fillRect(rightBarX, barY, barW * Math.min(1, rightFill), barH);
    if (balanced) {
      ctx.strokeStyle = "rgba(34,197,94,0.8)";
      ctx.lineWidth = 2 * dpr;
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.lineDashOffset = phase * 8;
      ctx.beginPath();
      ctx.moveTo(leftBarX + barW, barY + barH / 2);
      ctx.lineTo(rightBarX, barY + barH / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = "rgba(226,232,240,0.9)";
    ctx.font = `${9 * dpr}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(`sin i ${(displaySinI * 100).toFixed(0)}%`, leftBarX + barW / 2, barY - 5);
    ctx.fillText(`sin r ${(displaySinR * 100).toFixed(0)}%`, rightBarX + barW / 2, barY - 5);
    ctx.fillText("n₁ sin i = n₂ sin r", cx, barY + 30);
    ctx.textAlign = "left";
  }, [incidentAngleDeg, n1, n2, theta2Deg, tir, displaySinI, displaySinR, phase, showTIR]);

  return (
    <div
      className="laws-refraction-premium flex flex-col w-full max-w-[1600px] mx-auto px-[clamp(16px,3vw,32px)]"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-white" style={{ letterSpacing: "-0.01em" }}>
            Laws of Refraction
          </h1>
          <p className="text-sm opacity-70 text-neutral-300 mt-0.5">
            Snell&apos;s law: n₁ sin i = n₂ sin r. Ratio bars show sin i vs sin r.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap" style={{ transition: `all ${TRANSITION_MS}ms ${EASE}` }}>
          <div
            key={equationKey}
            className={`rounded-xl border border-white/10 px-4 py-2.5 font-mono text-sm ${
              balanced ? "shadow-[0_0_20px_-4px_rgba(34,197,94,0.4)]" : "shadow-[0_0_20px_-4px_rgba(34,211,238,0.25)]"
            }`}
            style={{
              background: balanced ? "rgba(34,197,94,0.12)" : "rgba(15,23,42,0.8)",
              color: balanced ? "rgba(134,239,172,0.95)" : "rgba(203,213,225,0.95)",
              animation: balanced ? "equationStableGlow 2s ease-in-out infinite, refraction-glow 1.2s ease-out" : undefined,
              transition: `opacity ${TRANSITION_MS}ms ${EASE}, filter ${TRANSITION_MS}ms ${EASE}, box-shadow ${TRANSITION_MS}ms ${EASE}`,
            }}
          >
            <span className="block text-white/70 text-xs mb-0.5">n₁ sin i = n₂ sin r</span>
            <span className="tabular-nums">
              {displayN1.toFixed(2)} × sin({Math.round(displayAngle)}°) = {displayN2.toFixed(2)} × sin({tir ? "—" : `${displayTheta2.toFixed(1)}°`})
            </span>
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

      <section className="laws-refraction-grid grid gap-6 w-full min-h-[600px] lg:min-h-[680px] xl:min-h-[720px]">
        <div
          className="simulator-scene-container relative rounded-[22px] overflow-hidden"
          style={{
            background: "radial-gradient(circle at 40% 30%, #1e3a5f 0%, #020617 70%)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 35px 100px rgba(0,0,0,0.75)",
          }}
        >
          <div
            ref={containerRef}
            className="relative w-full h-full min-h-[520px] lg:min-h-[600px] xl:min-h-[640px]"
            style={{ transition: `opacity ${TRANSITION_MS}ms ${EASE}` }}
          >
            {impactActive && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
                aria-hidden
              >
                <div
                  className="absolute w-24 h-24 rounded-full border-2 border-cyan-400/60 bg-cyan-400/20 animate-[impactRipple_200ms_ease-out_forwards]"
                  style={{ left: "50%", top: "50%", marginLeft: "-3rem", marginTop: "-3rem" }}
                />
                <div
                  className="absolute w-20 h-20 rounded-full bg-cyan-300/40 animate-[impactFlash_200ms_ease-out_forwards]"
                  style={{ left: "50%", top: "50%", marginLeft: "-2.5rem", marginTop: "-2.5rem" }}
                />
              </div>
            )}
            {floatingTooltip && (
              <div
                className="absolute left-1/2 top-[38%] -translate-x-1/2 z-20 px-3 py-2 rounded-lg text-xs font-medium text-cyan-100/95 bg-slate-800/90 border border-cyan-500/30 shadow-lg opacity-0"
                style={{
                  animation: "tooltipFadeIn 300ms cubic-bezier(0.22,0.61,0.36,1) forwards",
                }}
                role="status"
              >
                {floatingTooltip}
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full block object-contain pointer-events-none"
              style={{ width: "100%", height: "100%" }}
              aria-hidden
            />
            <div className="absolute inset-0 pointer-events-none">
              {["incident", "refracted", "normal", "boundary", "medium1", "medium2"].map((id) => (
                <span
                  key={id}
                  className={`absolute text-[11px] font-medium uppercase tracking-widest px-2 py-1 rounded transition-all duration-300 ${
                    visibleLabel === id ? "opacity-100" : "opacity-0"
                  } ${
                    id === "incident" ? "text-amber-300/95" :
                    id === "refracted" ? "text-cyan-300/95" :
                    id === "normal" ? "text-slate-300" :
                    id === "boundary" ? "text-cyan-300/80" :
                    id === "medium1" ? "text-amber-200/90" : "text-cyan-200/90"
                  }`}
                  style={
                    id === "incident" ? { left: "18%", top: "24%" } :
                    id === "refracted" ? { right: "18%", bottom: "24%" } :
                    id === "normal" ? { left: "50%", top: "46%", transform: "translateX(-50%)" } :
                    id === "boundary" ? { left: "50%", top: "52%", transform: "translate(-50%,-50%)" } :
                    id === "medium1" ? { left: "12%", top: "18%" } : { left: "12%", bottom: "18%" }
                  }
                >
                  {id === "incident" && "Incident ray"}
                  {id === "refracted" && "Refracted ray"}
                  {id === "normal" && "Normal"}
                  {id === "boundary" && "Boundary"}
                  {id === "medium1" && "Medium 1"}
                  {id === "medium2" && "Medium 2"}
                </span>
              ))}
            </div>
            <div className="absolute inset-0 pointer-events-auto" aria-hidden>
              <button type="button" className="absolute w-[110px] h-10 left-[14%] top-[20%]" onMouseEnter={() => showLabel("incident")} />
              <button type="button" className="absolute w-[110px] h-10 right-[14%] bottom-[20%]" onMouseEnter={() => showLabel("refracted")} />
              <button type="button" className="absolute w-12 h-16 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" onMouseEnter={() => showLabel("normal")} />
              <button type="button" className="absolute left-[12%] right-[12%] h-5 top-1/2 -translate-y-1/2" onMouseEnter={() => showLabel("boundary")} />
              <button type="button" className="absolute w-16 h-8 left-[8%] top-[14%]" onMouseEnter={() => showLabel("medium1")} />
              <button type="button" className="absolute w-16 h-8 left-[8%] bottom-[14%]" onMouseEnter={() => showLabel("medium2")} />
            </div>
          </div>
        </div>

        <aside
          className="control-panel-instrument rounded-[18px] flex flex-col gap-5 p-5 min-w-0"
          style={{
            transition: `opacity ${TRANSITION_MS}ms ${EASE}, transform ${TRANSITION_MS}ms ${EASE}`,
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium opacity-65">Try cases</p>
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
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium opacity-65">Angle control</p>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-300">Angle of incidence i</label>
              <datalist id="refraction-laws-angle-ticks">
                {[5, 20, 40, 60, 80, 88].map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="relative pt-8 pb-1">
                <span
                  className="slider-value-bubble absolute text-sm font-mono text-amber-300/95 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 -translate-x-1/2 whitespace-nowrap"
                  style={{
                    left: `${((displayAngle - 5) / (88 - 5)) * 100}%`,
                    top: 0,
                    transition: "left 250ms cubic-bezier(0.22,0.61,0.36,1), opacity 200ms ease",
                  }}
                >
                  {Math.round(displayAngle)}°
                </span>
                <input
                  type="range"
                  list="refraction-laws-angle-ticks"
                  min={5}
                  max={88}
                  step={1}
                  value={incidentAngleDeg}
                  onChange={(e) => setIncidentAngleDeg(Number(e.target.value))}
                  className="w-full h-2.5 rounded-full appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-amber-500/50 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                  style={{
                    WebkitAppearance: "none",
                    height: 10,
                    borderRadius: 5,
                    background: "linear-gradient(90deg, rgba(251,191,36,0.25), rgba(249,115,22,0.35))",
                    boxShadow: "inset 0 0 8px rgba(251,191,36,0.1)",
                  }}
                  aria-label="Angle of incidence in degrees"
                  //aria-valuemin={5}
                 // aria-valuemax={88}
                  //aria-valuenow={incidentAngleDeg}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium opacity-65">Refractive indices</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">n₁ (medium 1)</label>
                <div className="relative pt-8 pb-1">
                  <span
                    className="slider-value-bubble absolute text-xs font-mono text-cyan-300/95 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 -translate-x-1/2 whitespace-nowrap"
                    style={{
                      left: `${((displayN1 - 1) / 0.6) * 100}%`,
                      top: 0,
                      transition: "left 250ms cubic-bezier(0.22,0.61,0.36,1)",
                    }}
                  >
                    {displayN1.toFixed(2)}
                  </span>
                  <input
                    type="range"
                    list="refraction-laws-n-ticks"
                    min={1}
                    max={1.6}
                    step={0.01}
                    value={n1}
                    onChange={(e) => setN1(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-cyan-500/50 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.35)]"
                    style={{
                      WebkitAppearance: "none",
                      height: 8,
                      borderRadius: 4,
                      background: "linear-gradient(90deg, rgba(34,211,238,0.2), rgba(139,92,246,0.25))",
                      boxShadow: "inset 0 0 6px rgba(34,211,238,0.08)",
                    }}
                    aria-label="Refractive index of medium 1"
                    //aria-valuemin={1}
                    //aria-valuemax={1.6}
                    //aria-valuenow={n1}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">n₂ (medium 2)</label>
                <div className="relative pt-8 pb-1">
                  <span
                    className="slider-value-bubble absolute text-xs font-mono text-violet-300/95 px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-400/30 -translate-x-1/2 whitespace-nowrap"
                    style={{
                      left: `${((displayN2 - 1) / 0.6) * 100}%`,
                      top: 0,
                      transition: "left 250ms cubic-bezier(0.22,0.61,0.36,1)",
                    }}
                  >
                    {displayN2.toFixed(2)}
                  </span>
                  <input
                    type="range"
                    list="refraction-laws-n-ticks"
                    min={1}
                    max={1.6}
                    step={0.01}
                    value={n2}
                    onChange={(e) => setN2(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-violet-500/50 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(139,92,246,0.35)]"
                    style={{
                      WebkitAppearance: "none",
                      height: 8,
                      borderRadius: 4,
                      background: "linear-gradient(90deg, rgba(34,211,238,0.2), rgba(139,92,246,0.25))",
                      boxShadow: "inset 0 0 6px rgba(139,92,246,0.08)",
                    }}
                    aria-label="Refractive index of medium 2"
                    //aria-valuemin={1}
                    //aria-valuemax={1.6}
                    //aria-valuenow={n2}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium opacity-65">Advanced mode</p>
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 hover:bg-white/10 transition-colors focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:ring-offset-2 focus-within:ring-offset-slate-900">
              <input
                type="checkbox"
                checked={showTIR}
                onChange={(e) => setShowTIR(e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-700 text-cyan-500 focus:ring-cyan-500/50"
                aria-label="Show critical angle and total internal reflection"
              />
              <span className="text-sm text-neutral-300">Show critical angle &amp; TIR</span>
            </label>
            {showTIR && (
              <p className="text-xs font-mono text-cyan-300/90">
                Critical angle ≈ {critDeg.toFixed(1)}°
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 mt-auto">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium opacity-65">Result</p>
            <p className="text-sm text-neutral-200">
              sin i = <span className="font-mono text-amber-300/95">{sinI.toFixed(3)}</span>
              {" "} sin r = <span className="font-mono text-cyan-300/95">{tir ? "1.000" : sinR.toFixed(3)}</span>
            </p>
            {balanced && (
              <p className="text-xs text-emerald-400/90 font-medium">n₁ sin i = n₂ sin r ✓</p>
            )}
          </div>
        </aside>
      </section>

      <datalist id="refraction-laws-n-ticks">
        {[1, 1.2, 1.4, 1.6].map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>

      <section className="mt-6 rounded-[18px] border border-white/10 overflow-hidden" style={{ background: "rgba(15,23,42,0.5)" }}>
        <button
          type="button"
          onClick={() => setInsightOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500/50"
          aria-expanded={insightOpen}
          aria-controls="laws-refraction-insight-content"
        >
          <span className="text-base font-semibold text-white">Why does refraction occur?</span>
          <span className="text-neutral-400 text-sm" aria-hidden>{insightOpen ? "−" : "+"}</span>
        </button>
        <div
          id="laws-refraction-insight-content"
          role="region"
          className={`overflow-hidden transition-all duration-300 ${insightOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
          style={{ transitionProperty: "max-height, opacity" }}
        >
          <p className="px-5 pb-5 text-sm leading-relaxed text-cyan-300/95">
            {insightText}
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
          aria-controls="laws-refraction-panel-concept"
          id="laws-refraction-tab-concept"
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
          aria-controls="laws-refraction-panel-experiment"
          id="laws-refraction-tab-experiment"
        >
          Experiment
        </button>
      </div>
      <div
        role="tabpanel"
        id="laws-refraction-panel-concept"
        aria-labelledby="laws-refraction-tab-concept"
        className="py-4 text-sm text-neutral-300 leading-relaxed"
        hidden={activeTab !== "concept"}
      >
        Snell&apos;s law relates the angles of incidence and refraction to the refractive indices: n₁ sin i = n₂ sin r. When light passes from a medium with lower n to higher n, it bends toward the normal; from higher to lower n, it bends away. The ratio bars in the simulator show how sin i and sin r change with angle.
      </div>
      <div
        role="tabpanel"
        id="laws-refraction-panel-experiment"
        aria-labelledby="laws-refraction-tab-experiment"
        className="py-4 text-sm text-neutral-300 leading-relaxed"
        hidden={activeTab !== "experiment"}
      >
        Use the presets to jump to Air→Glass, Glass→Air, High Refraction, or Near Critical Angle. Adjust the angle and n₁, n₂ sliders to see how the refracted ray and sin bars update. Enable &quot;Show critical angle &amp; TIR&quot; to see total internal reflection when the angle exceeds the critical value.
      </div>
    </div>
  );
}
