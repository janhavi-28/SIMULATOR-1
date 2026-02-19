"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const degToRad = (d: number) => (d * Math.PI) / 180;
const radToDeg = (r: number) => (r * 180) / Math.PI;

function snell(
  n1: number,
  n2: number,
  theta1Deg: number
): { theta2Deg: number; tir: boolean } {
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
  { id: "air-glass", label: "Air → Glass", n1: 1, n2: 1.5, angle: 35 },
  { id: "water-air", label: "Water → Air", n1: 1.33, n2: 1, angle: 50 },
  { id: "critical", label: "Critical Angle", n1: 1.5, n2: 1, angle: 41.8 },
] as const;

function getInsight(
  tir: boolean,
  n1: number,
  n2: number
): { text: string; color: "cyan" | "violet" | "amber" } {
  if (tir)
    return {
      text: "Total internal reflection — angle exceeds critical angle; no refraction into medium 2.",
      color: "amber",
    };
  if (n2 > n1)
    return {
      text: "Ray bends toward the normal.",
      color: "cyan",
    };
  return {
    text: "Ray bends away from the normal.",
    color: "violet",
  };
}

function getConceptInsightText(tir: boolean, n1: number, n2: number): string {
  if (tir) return "Total internal reflection occurs.";
  if (n2 > n1) return "Ray bends toward the normal.";
  return "Ray bends away from the normal.";
}

const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const TRANSITION_MS = 280;
const DEMO_STEP_DELAY_MS = 1500;
const LERP_SPEED = 8;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, t);
}

export default function RefractionOfLightSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [phase, setPhase] = useState(0);
  const [incidentAngleDeg, setIncidentAngleDeg] = useState(35);
  const [n1, setN1] = useState(1);
  const [n2, setN2] = useState(1.5);
  const [insightOpen, setInsightOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"concept" | "experiment">("concept");
  const [visibleLabel, setVisibleLabel] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [predictionMode, setPredictionMode] = useState(false);
  const [predictionConfirmed, setPredictionConfirmed] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [slowMotion, setSlowMotion] = useState(false);
  const [colorblindMode, setColorblindMode] = useState(false);
  const [equationFlash, setEquationFlash] = useState(false);
  const [boundaryFlashPhase, setBoundaryFlashPhase] = useState(0);

  const lastTsRef = useRef<number | null>(null);
  const labelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animAngleRef = useRef(35);
  const animN1Ref = useRef(1);
  const animN2Ref = useRef(1.5);
  const [displayAngle, setDisplayAngle] = useState(35);
  const [displayTheta2, setDisplayTheta2] = useState(25.9);
  const [displayN1, setDisplayN1] = useState(1);
  const [displayN2, setDisplayN2] = useState(1.5);

  const { theta2Deg, tir } = snell(n1, n2, incidentAngleDeg);
  const insight = getInsight(tir, n1, n2);
  const conceptText = useMemo(
    () => getConceptInsightText(tir, n1, n2),
    [tir, n1, n2]
  );

  const showLabel = useCallback((id: string) => {
    if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
    setVisibleLabel(id);
    labelTimeoutRef.current = setTimeout(() => setVisibleLabel(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setEquationFlash(true);
    const t = setTimeout(() => setEquationFlash(false), 400);
    return () => clearTimeout(t);
  }, [incidentAngleDeg, n1, n2]);

  useEffect(() => {
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      const speed = slowMotion ? 0.5 : 1;
      const animSpeed = hasLaunched && !paused ? 1.2 * speed : 0.25 * speed;
      setPhase((p) => p + dt * animSpeed);
      const dtScaled = dt * LERP_SPEED * (slowMotion ? 0.5 : 1);
      animAngleRef.current = lerp(animAngleRef.current, incidentAngleDeg, dtScaled);
      animN1Ref.current = lerp(animN1Ref.current, n1, dtScaled);
      animN2Ref.current = lerp(animN2Ref.current, n2, dtScaled);
      setDisplayAngle((a) => lerp(a, incidentAngleDeg, dtScaled));
      setDisplayTheta2((t) => lerp(t, tir ? 90 : theta2Deg, dtScaled));
      setDisplayN1((v) => lerp(v, n1, dtScaled));
      setDisplayN2((v) => lerp(v, n2, dtScaled));
      setBoundaryFlashPhase((p) => (p + dt * 4) % (Math.PI * 2));
    };
    raf = requestAnimationFrame((ts) => {
      lastTsRef.current = ts;
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused, incidentAngleDeg, n1, n2, theta2Deg, tir, slowMotion]);

  const launch = useCallback(() => {
    setPaused(false);
    setHasLaunched(true);
    setDemoMode(false);
    if (predictionMode) setPredictionConfirmed(true);
  }, [predictionMode]);

  const reset = useCallback(() => {
    setPaused(true);
    setHasLaunched(false);
    setDemoMode(false);
    setDemoStep(0);
    setPredictionConfirmed(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setPaused((p) => !p);
    if (!hasLaunched) setHasLaunched(true);
  }, [hasLaunched]);

  const runDemo = useCallback(() => {
    setDemoMode(true);
    setHasLaunched(true);
    setPaused(false);
    setPredictionMode(false);
    setDemoStep(0);
    setN1(1);
    setN2(1.5);
    setIncidentAngleDeg(30);
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    const steps = [
      () => setDemoStep(1),
      () => setDemoStep(2),
      () => setDemoStep(3),
      () => {
        setIncidentAngleDeg(45);
        setDemoStep(4);
      },
      () => setDemoStep(5),
    ];
    steps.forEach((fn, i) => {
      demoTimeoutRef.current = setTimeout(fn, (i + 1) * DEMO_STEP_DELAY_MS);
    });
    demoTimeoutRef.current = setTimeout(() => {
      setDemoMode(false);
      setDemoStep(0);
    }, (steps.length + 1) * DEMO_STEP_DELAY_MS);
  }, []);

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

  const animAngle = animAngleRef.current;
  const animTheta2 = tir ? 90 : displayTheta2;

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
    const rayLen = Math.min(w, h) * 0.38;
    const theta1 = degToRad(animAngle);
    const theta2 = degToRad(animTheta2);
    const hitX = cx;
    const t = (phase * 0.5) % 1;
    const shimmer = 0.7 + 0.3 * Math.sin(phase * 2);

    ctx.clearRect(0, 0, w, h);

    const rad = ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      Math.max(w, h) * 0.7
    );
    rad.addColorStop(0, highContrast ? "#0a1929" : "#0f2a3d");
    rad.addColorStop(0.5, "#0a1628");
    rad.addColorStop(0.8, "#020617");
    rad.addColorStop(1, "#020617");
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, w, h);

    const topDensity = 0.3 + (n1 - 1) * 0.4;
    const botDensity = 0.3 + (n2 - 1) * 0.4;
    const bgTop = ctx.createLinearGradient(0, 0, 0, boundaryY);
    bgTop.addColorStop(0, highContrast ? "rgba(15,42,61,0.6)" : "rgba(15,42,61,0.4)");
    bgTop.addColorStop(1, `rgba(56,189,248,${0.06 + topDensity * 0.08})`);
    ctx.fillStyle = bgTop;
    ctx.fillRect(0, 0, w, boundaryY);
    const bgBot = ctx.createLinearGradient(0, boundaryY, 0, h);
    bgBot.addColorStop(0, `rgba(34,211,238,${0.08 + botDensity * 0.06})`);
    bgBot.addColorStop(1, highContrast ? "rgba(15,42,61,0.6)" : "rgba(15,42,61,0.4)");
    ctx.fillStyle = bgBot;
    ctx.fillRect(0, boundaryY, w, h - boundaryY);

    const particleCount1 = Math.floor(8 + n1 * 12);
    const particleCount2 = Math.floor(8 + n2 * 12);
    for (let i = 0; i < particleCount1; i++) {
      const x =
        (w * (0.15 + 0.7 * (i / Math.max(1, particleCount1 - 1)))) +
        15 * Math.sin(phase + i * 0.7);
      const y =
        boundaryY * (0.2 + 0.6 * (i % 3) / 3) +
        6 * Math.cos(phase * 1.3 + i);
      if (y > 4 && y < boundaryY - 4) {
        const alpha = 0.06 + 0.04 * Math.sin(phase + i) * (1 + topDensity * 0.5);
        ctx.fillStyle = `rgba(148,163,184,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let i = 0; i < particleCount2; i++) {
      const x =
        (w * (0.15 + 0.7 * (i / Math.max(1, particleCount2 - 1)))) +
        15 * Math.sin(phase * 1.1 + i * 0.8);
      const y =
        boundaryY +
        (h - boundaryY) * (0.15 + 0.6 * (i % 3) / 3) +
        6 * Math.cos(phase * 1.2 + i);
      if (y > boundaryY + 4 && y < h - 4) {
        const alpha = 0.06 + 0.04 * Math.sin(phase + i * 1.2) * (1 + botDensity * 0.5);
        ctx.fillStyle = `rgba(148,163,184,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const ripple = 2 + Math.sin(phase * 3) * 0.8;
    ctx.strokeStyle = highContrast
      ? "rgba(34,211,238,0.6)"
      : "rgba(34,211,238,0.35)";
    ctx.lineWidth = (2 + ripple) * dpr;
    ctx.setLineDash([8 * dpr, 6 * dpr]);
    ctx.lineDashOffset = phase * 20;
    ctx.beginPath();
    ctx.moveTo(0, boundaryY);
    ctx.lineTo(w, boundaryY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = highContrast
      ? "rgba(34,211,238,0.9)"
      : "rgba(34,211,238,0.55)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, boundaryY);
    ctx.lineTo(w, boundaryY);
    ctx.stroke();

    const boundaryFlash = Math.max(0, Math.sin(boundaryFlashPhase) * 0.3);
    const glowSize = (35 + boundaryFlash * 15) * dpr;
    const hitGrad = ctx.createRadialGradient(
      hitX,
      boundaryY,
      0,
      hitX,
      boundaryY,
      glowSize
    );
    hitGrad.addColorStop(0, `rgba(254,240,138,${0.25 + boundaryFlash})`);
    hitGrad.addColorStop(0.4, "rgba(103,232,249,0.12)");
    hitGrad.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = hitGrad;
    ctx.fillRect(hitX - glowSize, boundaryY - glowSize, glowSize * 2, glowSize * 2);

    const rippleRadius = 20 + Math.sin(phase * 4) * 5;
    ctx.strokeStyle = `rgba(103,232,249,${0.15 + 0.1 * Math.sin(phase * 2)})`;
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(hitX, boundaryY, rippleRadius * dpr, 0, Math.PI * 2);
    ctx.stroke();

    const showIncident =
      !predictionMode || predictionConfirmed || demoStep >= 1;
    const showBoundary = demoStep >= 2;
    const showRefracted = (!tir && (demoStep >= 3 || !demoMode)) || (tir && !demoMode);
    const showAngles = demoStep >= 4 || !demoMode;

    if (showIncident) {
      const incEndX = hitX - Math.sin(theta1) * rayLen;
      const incEndY = boundaryY - Math.cos(theta1) * rayLen;
      const incGrad = ctx.createLinearGradient(
        incEndX,
        incEndY,
        hitX,
        boundaryY
      );
      incGrad.addColorStop(0, `rgba(254,240,138,${0.5 * shimmer})`);
      incGrad.addColorStop(0.5, "rgba(251,191,36,0.95)");
      incGrad.addColorStop(1, "rgba(254,240,138,0.95)");
      ctx.shadowColor = "rgba(254,240,138,0.7)";
      ctx.shadowBlur = 12 * dpr;
      ctx.strokeStyle = incGrad;
      ctx.lineWidth = 2.8 * dpr;
      ctx.beginPath();
      ctx.moveTo(incEndX, incEndY);
      ctx.lineTo(hitX, boundaryY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      const speed1 = 1 / n1;
      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        const pt = ((t + i / particleCount) % 1) * speed1;
        const px = incEndX + (hitX - incEndX) * pt;
        const py = incEndY + (boundaryY - incEndY) * pt;
        ctx.fillStyle = `rgba(254,240,138,${0.9 - pt * 0.3})`;
        ctx.shadowColor = "rgba(254,240,138,0.8)";
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        ctx.arc(px, py, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      const pulsePos = (phase * 0.4) % 1;
      const pulseX = incEndX + (hitX - incEndX) * pulsePos;
      const pulseY = incEndY + (boundaryY - incEndY) * pulsePos;
      const pulseGrad = ctx.createRadialGradient(
        pulseX,
        pulseY,
        0,
        pulseX,
        pulseY,
        20 * dpr
      );
      pulseGrad.addColorStop(0, "rgba(254,240,138,0.5)");
      pulseGrad.addColorStop(0.5, "rgba(251,191,36,0.2)");
      pulseGrad.addColorStop(1, "rgba(254,240,138,0)");
      ctx.fillStyle = pulseGrad;
      ctx.fillRect(pulseX - 25, pulseY - 25, 50, 50);
    }

    if (showBoundary || !demoMode) {
      ctx.strokeStyle = "rgba(34,211,238,0.4)";
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(hitX, boundaryY);
      ctx.lineTo(hitX, boundaryY - 80 * dpr);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (showRefracted && !tir) {
      const refrEndX = hitX + Math.sin(theta2) * rayLen;
      const refrEndY = boundaryY + Math.cos(theta2) * rayLen;
      const refrGrad = ctx.createLinearGradient(
        hitX,
        boundaryY,
        refrEndX,
        refrEndY
      );
      refrGrad.addColorStop(0, "rgba(103,232,249,0.95)");
      refrGrad.addColorStop(0.5, "rgba(34,211,238,0.95)");
      refrGrad.addColorStop(1, `rgba(103,232,249,${0.6 * shimmer})`);
      ctx.shadowColor = "rgba(103,232,249,0.6)";
      ctx.shadowBlur = 10 * dpr;
      ctx.strokeStyle = refrGrad;
      ctx.beginPath();
      ctx.moveTo(hitX, boundaryY);
      ctx.lineTo(refrEndX, refrEndY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      const speed2 = 1 / n2;
      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        const pt = ((t + i / particleCount) % 1) * speed2;
        const px = hitX + (refrEndX - hitX) * pt;
        const py = boundaryY + (refrEndY - boundaryY) * pt;
        ctx.fillStyle = `rgba(103,232,249,${0.9 - pt * 0.3})`;
        ctx.shadowColor = "rgba(103,232,249,0.7)";
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        ctx.arc(px, py, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      const pulsePos = (phase * 0.35) % 1;
      const pulseX = hitX + (refrEndX - hitX) * pulsePos;
      const pulseY = boundaryY + (refrEndY - boundaryY) * pulsePos;
      const pulseGrad = ctx.createRadialGradient(
        pulseX,
        pulseY,
        0,
        pulseX,
        pulseY,
        18 * dpr
      );
      pulseGrad.addColorStop(0, "rgba(103,232,249,0.4)");
      pulseGrad.addColorStop(0.5, "rgba(34,211,238,0.15)");
      pulseGrad.addColorStop(1, "rgba(103,232,249,0)");
      ctx.fillStyle = pulseGrad;
      ctx.fillRect(pulseX - 22, pulseY - 22, 44, 44);

      const ang = Math.atan2(refrEndY - boundaryY, refrEndX - hitX);
      const arr = 11 * dpr;
      ctx.fillStyle = "rgba(103,232,249,0.95)";
      ctx.beginPath();
      ctx.moveTo(refrEndX, refrEndY);
      ctx.lineTo(
        refrEndX - arr * Math.cos(ang - 0.35),
        refrEndY - arr * Math.sin(ang - 0.35)
      );
      ctx.lineTo(
        refrEndX - arr * Math.cos(ang + 0.35),
        refrEndY - arr * Math.sin(ang + 0.35)
      );
      ctx.closePath();
      ctx.fill();
    } else if (tir) {
      const reflEndX = hitX + Math.sin(theta1) * rayLen;
      const reflEndY = boundaryY - Math.cos(theta1) * rayLen;
      ctx.strokeStyle = highContrast
        ? "rgba(248,113,113,1)"
        : "rgba(248,113,113,0.9)";
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.lineDashOffset = -phase * 15;
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(hitX, boundaryY);
      ctx.lineTo(reflEndX, reflEndY);
      ctx.stroke();
      ctx.setLineDash([]);

      const speed1 = 1 / n1;
      for (let i = 0; i < 6; i++) {
        const pt = ((t + i / 6) % 1) * speed1;
        const px = hitX + (reflEndX - hitX) * pt;
        const py = boundaryY + (reflEndY - boundaryY) * pt;
        ctx.fillStyle = `rgba(248,113,113,${0.9 - pt * 0.3})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(248,113,113,0.95)";
      ctx.font = `${12 * dpr}px system-ui`;
      ctx.fillText("TIR", hitX + 22, boundaryY - 28);
    }

    if (showAngles) {
      const arcR = 42 * dpr;
      ctx.strokeStyle = "rgba(251,191,36,0.75)";
      ctx.lineWidth = 2 * dpr;
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.beginPath();
      ctx.arc(hitX, boundaryY - 30, arcR, -theta1, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!tir) {
        ctx.strokeStyle = "rgba(103,232,249,0.75)";
        ctx.lineWidth = 2 * dpr;
        ctx.setLineDash([4 * dpr, 3 * dpr]);
        ctx.beginPath();
        ctx.arc(hitX, boundaryY + 30, arcR, 0, theta2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.fillStyle = highContrast ? "rgba(226,232,240,1)" : "rgba(226,232,240,0.85)";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.fillText(`n₁ = ${n1.toFixed(2)}`, 24, boundaryY - 28);
    ctx.fillText(`n₂ = ${n2.toFixed(2)}`, 24, boundaryY + 32);
  }, [
    incidentAngleDeg,
    n1,
    n2,
    theta2Deg,
    tir,
    phase,
    animAngle,
    animTheta2,
    demoStep,
    demoMode,
    predictionMode,
    predictionConfirmed,
    highContrast,
    colorblindMode,
    boundaryFlashPhase,
    displayTheta2,
  ]);

  const trackStyle = (type: "angle" | "n") =>
    type === "angle"
      ? { background: "linear-gradient(to right, rgb(234,179,8), rgb(249,115,22))" }
      : { background: "linear-gradient(to right, rgb(34,211,238), rgb(139,92,246))" };

  const leftEq = n1 * Math.sin(degToRad(incidentAngleDeg));
  const rightEq = tir ? n2 : n2 * Math.sin(degToRad(theta2Deg));
  const equalityHolds = Math.abs(leftEq - rightEq) < 0.02;

  const demoCaptions: Record<number, string> = {
    1: "Incident ray approaches the boundary.",
    2: "The boundary separates two media with different optical densities.",
    3: "Refracted ray bends at the interface.",
    4: "Notice the angle change: incidence vs refraction.",
    5: "Light bends because speed changes between media.",
  };

  return (
    <div
      className="refraction-premium flex flex-col w-full max-w-[1600px] mx-auto px-[clamp(16px,3vw,32px)]"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-white" style={{ letterSpacing: "-0.01em" }}>
            Refraction of Light
          </h1>
          <p className="text-sm opacity-70 text-neutral-300 mt-0.5">
            Two media. Ray bends at boundary. Snell&apos;s law: n₁ sin i = n₂ sin r.
          </p>
        </div>
        <div
          className="flex items-center gap-3 flex-wrap"
          style={{ transition: `all ${TRANSITION_MS}ms ${EASE}` }}
        >
          <div
            className={`rounded-xl border px-4 py-2.5 font-mono text-sm transition-all duration-300 ${
              equationFlash || equalityHolds
                ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100 shadow-[0_0_24px_-2px_rgba(34,211,238,0.5)]"
                : "border-white/10 bg-slate-900/80 text-cyan-200/90 shadow-[0_0_20px_-4px_rgba(34,211,238,0.3)]"
            }`}
            style={{
              animation: equationFlash ? "refraction-glow 0.4s ease-out" : undefined,
              transition: `all ${TRANSITION_MS}ms ${EASE}`,
            }}
          >
            n₁({displayN1.toFixed(2)}) sin {Math.round(displayAngle)}° = n₂({displayN2.toFixed(2)}) sin {tir ? "—" : `${displayTheta2.toFixed(1)}°`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={launch}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-[180ms] ease-out hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                hasLaunched
                  ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-200 shadow-[0_0_16px_-2px_rgba(34,211,238,0.4)]"
                  : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
              }`}
              aria-label="Launch simulation"
            >
              Launch
            </button>
            <button
              type="button"
              onClick={togglePlayPause}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-[180ms] ease-out hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                !paused
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_20px_-2px_rgba(34,211,238,0.6)]"
                  : "bg-cyan-500/70 text-slate-100 hover:bg-cyan-500"
              }`}
              aria-label={paused ? "Play" : "Pause"}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              type="button"
              onClick={reset}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-[180ms] ease-out hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                !hasLaunched
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200 shadow-[0_0_12px_-2px_rgba(251,191,36,0.3)]"
                  : "border-neutral-600 bg-neutral-800/80 text-neutral-200 hover:bg-neutral-700"
              }`}
              aria-label="Reset"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={runDemo}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-[180ms] ease-out hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                demoMode
                  ? "border-violet-500/60 bg-violet-500/20 text-violet-200 shadow-[0_0_16px_-2px_rgba(139,92,246,0.4)]"
                  : "border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
              }`}
              aria-label="Run demo"
            >
              Demo
            </button>
          </div>
        </div>
      </header>

      <section className="refraction-premium-grid grid gap-6 w-full min-h-[600px] lg:min-h-[680px] xl:min-h-[720px]">
        <div
          className="relative rounded-[22px] overflow-hidden"
          style={{
            background: "radial-gradient(circle at center, #0f2a3d 0%, #020617 80%)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 30px 80px rgba(0,0,0,0.7)",
          }}
        >
          {demoMode && demoCaptions[demoStep] && (
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-6 z-10 px-5 py-3 rounded-xl bg-slate-900/95 border border-cyan-500/30 text-cyan-100 text-sm font-medium shadow-lg opacity-95 transition-opacity duration-300"
              style={{ maxWidth: "90%" }}
            >
              {demoCaptions[demoStep]}
            </div>
          )}
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
            {showLabels && (
              <div className="absolute inset-0 pointer-events-none">
                <span
                  className={`absolute text-[11px] font-medium uppercase tracking-widest px-2 py-1 rounded transition-all duration-300 ${
                    visibleLabel === "incident" ? "opacity-100 text-amber-300/95" : "opacity-70"
                  }`}
                  style={{ left: "18%", top: "22%", color: "rgba(251,191,36,0.95)" }}
                >
                  Incident Ray
                </span>
                <span
                  className={`absolute text-[11px] font-medium uppercase tracking-widest px-2 py-1 rounded transition-all duration-300 ${
                    visibleLabel === "normal" ? "opacity-100 text-slate-300" : "opacity-70"
                  }`}
                  style={{
                    left: "48%",
                    top: "38%",
                    transform: "translateX(-50%)",
                    color: "rgba(226,232,240,0.9)",
                  }}
                >
                  Normal
                </span>
                <span
                  className={`absolute text-[11px] font-medium uppercase tracking-widest px-2 py-1 rounded transition-all duration-300 ${
                    visibleLabel === "boundary" ? "opacity-100 text-cyan-300/95" : "opacity-70"
                  }`}
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%,-50%)",
                    color: "rgba(103,232,249,0.95)",
                  }}
                >
                  Boundary
                </span>
                <span
                  className={`absolute text-[11px] font-medium uppercase tracking-widest px-2 py-1 rounded transition-all duration-300 ${
                    visibleLabel === "refracted" ? "opacity-100 text-cyan-300/95" : "opacity-70"
                  }`}
                  style={{ left: "78%", top: "72%", color: "rgba(103,232,249,0.95)" }}
                >
                  Refracted Ray
                </span>
                <span
                  className="absolute text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded opacity-70"
                  style={{ left: "24%", top: "8%", color: "rgba(251,191,36,0.9)" }}
                >
                  Medium 1
                </span>
                <span
                  className="absolute text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded opacity-70"
                  style={{ left: "24%", bottom: "8%", color: "rgba(103,232,249,0.9)" }}
                >
                  Medium 2
                </span>
                <span
                  className="absolute text-[10px] font-medium px-2 py-1 rounded opacity-70"
                  style={{
                    left: "50%",
                    bottom: "52%",
                    transform: "translate(-50%,100%)",
                    color: "rgba(34,211,238,0.95)",
                  }}
                >
                  Light changes speed here
                </span>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-auto" aria-hidden>
              <button
                type="button"
                className="absolute w-[120px] h-8 left-[12%] top-[18%]"
                onMouseEnter={() => showLabel("incident")}
              />
              <button
                type="button"
                className="absolute w-12 h-12 left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2"
                onMouseEnter={() => showLabel("normal")}
              />
              <button
                type="button"
                className="absolute left-0 right-0 h-4 top-1/2 -translate-y-1/2"
                onMouseEnter={() => showLabel("boundary")}
              />
              <button
                type="button"
                className="absolute w-[100px] h-8 right-[18%] bottom-[22%]"
                onMouseEnter={() => showLabel("refracted")}
              />
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
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium">
              Concept Insight
            </p>
            <p
              className={`text-sm font-medium ${
                insight.color === "cyan"
                  ? "text-cyan-300/95"
                  : insight.color === "violet"
                    ? "text-violet-300/95"
                    : "text-amber-300/95"
              }`}
            >
              {conceptText}
            </p>
          </div>

          <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium">
            Try experiments
          </p>
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

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
            />
            <span className="text-xs text-neutral-300">Show Labels</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={predictionMode}
              onChange={(e) => {
                setPredictionMode(e.target.checked);
                if (e.target.checked) setPredictionConfirmed(false);
              }}
              className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
            />
            <span className="text-xs text-neutral-300">Prediction Mode</span>
          </label>

          <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium mt-2">
            Accessibility
          </p>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
              />
              <span className="text-xs text-neutral-300">High Contrast</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={slowMotion}
                onChange={(e) => setSlowMotion(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
              />
              <span className="text-xs text-neutral-300">Slow Motion</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={colorblindMode}
                onChange={(e) => setColorblindMode(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
              />
              <span className="text-xs text-neutral-300">Colorblind</span>
            </label>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium">
              Incident ray
            </p>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-300">
                Angle of incidence (i)
              </label>
              <datalist id="angle-ticks">
                {[0, 15, 30, 45, 60, 75, 90].map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="relative pt-6">
                <input
                  type="range"
                  list="angle-ticks"
                  min={5}
                  max={88}
                  step={1}
                  value={incidentAngleDeg}
                  onChange={(e) => setIncidentAngleDeg(Number(e.target.value))}
                  className="w-full h-2.5 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-amber-500/50 [&::-webkit-slider-thumb]:shadow-lg"
                  style={{
                    ...trackStyle("angle"),
                    WebkitAppearance: "none",
                    height: 10,
                    borderRadius: 5,
                  }}
                  aria-label="Angle of incidence in degrees"
                  aria-valuemin={5}
                  aria-valuemax={88}
                  aria-valuenow={incidentAngleDeg}
                />
                <span className="absolute -top-0.5 left-0 right-0 text-center text-sm font-mono text-amber-300/95">
                  {incidentAngleDeg}°
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium">
              Medium properties
            </p>
            <div className="space-y-3">
              <datalist id="n-ticks">
                {[1, 1.2, 1.4, 1.6].map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  n₁ (first medium)
                </label>
                <div className="relative pt-5">
                  <input
                    type="range"
                    list="n-ticks"
                    min={1}
                    max={1.6}
                    step={0.01}
                    value={n1}
                    onChange={(e) => setN1(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-cyan-500/50"
                    style={{
                      ...trackStyle("n"),
                      WebkitAppearance: "none",
                      height: 8,
                      borderRadius: 4,
                    }}
                    aria-label="Refractive index of first medium"
                    aria-valuemin={1}
                    aria-valuemax={1.6}
                    aria-valuenow={n1}
                  />
                  <span className="absolute top-0 left-0 text-xs font-mono text-cyan-300/95">
                    {n1.toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  n₂ (second medium)
                </label>
                <div className="relative pt-5">
                  <input
                    type="range"
                    list="n-ticks"
                    min={1}
                    max={1.6}
                    step={0.01}
                    value={n2}
                    onChange={(e) => setN2(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-violet-500/50"
                    style={{
                      ...trackStyle("n"),
                      WebkitAppearance: "none",
                      height: 8,
                      borderRadius: 4,
                    }}
                    aria-label="Refractive index of second medium"
                    aria-valuemin={1}
                    aria-valuemax={1.6}
                    aria-valuenow={n2}
                  />
                  <span className="absolute top-0 left-0 text-xs font-mono text-violet-300/95">
                    {n2.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 mt-auto">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 font-medium">
              Result
            </p>
            <p className="text-sm text-neutral-200">
              Angle of refraction r ={" "}
              <span
                className={`font-mono font-semibold ${tir ? "text-amber-400" : "text-cyan-300"}`}
              >
                {tir ? "TIR" : `${theta2Deg.toFixed(1)}°`}
              </span>
            </p>
            <p className="text-xs text-neutral-400 font-mono">n₁ sin i = n₂ sin r</p>
          </div>
        </aside>
      </section>

      <section
        className="mt-6 rounded-[18px] border border-white/10 overflow-hidden"
        style={{ background: "rgba(15,23,42,0.5)" }}
      >
        <button
          type="button"
          onClick={() => setInsightOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500/50"
          aria-expanded={insightOpen}
          aria-controls="refraction-insight-content"
        >
          <span className="text-base font-semibold text-white">
            What&apos;s happening physically?
          </span>
          <span className="text-neutral-400 text-sm" aria-hidden>
            {insightOpen ? "−" : "+"}
          </span>
        </button>
        <div
          id="refraction-insight-content"
          role="region"
          aria-labelledby="refraction-insight-heading"
          className={`overflow-hidden transition-all duration-300 ${
            insightOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{ transitionProperty: "max-height, opacity" }}
        >
          <p
            id="refraction-insight-heading"
            className={`px-5 pb-5 text-sm leading-relaxed ${
              insight.color === "cyan"
                ? "text-cyan-300/95"
                : insight.color === "violet"
                  ? "text-violet-300/95"
                  : "text-amber-300/95"
            }`}
          >
            {insight.text}
          </p>
        </div>
      </section>

      <div
        className="mt-4 flex border-b border-white/10"
        role="tablist"
        aria-label="Concept and Experiment tabs"
      >
        <button
          type="button"
          onClick={() => setActiveTab("concept")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
            activeTab === "concept"
              ? "text-cyan-400 border-b-2 border-cyan-500 text-cyan-400"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
          aria-selected={activeTab === "concept"}
          role="tab"
          aria-controls="refraction-panel-concept"
          id="refraction-tab-concept"
        >
          Concept
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("experiment")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
            activeTab === "experiment"
              ? "text-cyan-400 border-b-2 border-cyan-500"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
          aria-selected={activeTab === "experiment"}
          role="tab"
          aria-controls="refraction-panel-experiment"
          id="refraction-tab-experiment"
        >
          Experiment
        </button>
      </div>
      <div
        role="tabpanel"
        id="refraction-panel-concept"
        aria-labelledby="refraction-tab-concept"
        className="py-4 text-sm text-neutral-300 leading-relaxed"
        hidden={activeTab !== "concept"}
      >
        Snell&apos;s law relates the angles and refractive indices: n₁ sin i = n₂ sin
        r. When light passes from a medium of lower n to higher n, it bends toward
        the normal; from higher to lower n, it bends away. Beyond the critical
        angle, total internal reflection occurs.
      </div>
      <div
        role="tabpanel"
        id="refraction-panel-experiment"
        aria-labelledby="refraction-tab-experiment"
        className="py-4 text-sm text-neutral-300 leading-relaxed"
        hidden={activeTab !== "experiment"}
      >
        Use the presets to jump to classic setups: Air → Glass (bending toward
        normal), Water → Air (bending away), and Critical Angle (TIR). Adjust
        sliders to see how angle and refractive indices affect the refracted ray
        in real time.
      </div>
    </div>
  );
}
