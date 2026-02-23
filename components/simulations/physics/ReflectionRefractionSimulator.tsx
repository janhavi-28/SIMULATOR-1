"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const MEDIUM_DATA: Record<
  string,
  { n1: number; n2: number; name: string; info: string; topColor: string; bottomColor: string }
> = {
  air: {
    n1: 1.0,
    n2: 1.33,
    name: "Air → Water",
    info:
      "Water is denser than air, so light slows down and bends toward the normal. This is why a straw looks bent in a glass of water!",
    topColor: "rgba(135, 206, 235, 0.05)",
    bottomColor: "rgba(0, 150, 255, 0.2)",
  },
  water: {
    n1: 1.33,
    n2: 1.52,
    name: "Water → Glass",
    info:
      "Glass is denser than water. The change in density is smaller here, so the bending is less dramatic than air-to-water.",
    topColor: "rgba(0, 150, 255, 0.2)",
    bottomColor: "rgba(100, 149, 237, 0.25)",
  },
  glass: {
    n1: 1.0,
    n2: 1.52,
    name: "Air → Glass",
    info:
      "Glass has a higher refractive index than air. This is how lenses in eyeglasses and cameras work to focus light!",
    topColor: "rgba(135, 206, 235, 0.05)",
    bottomColor: "rgba(100, 149, 237, 0.25)",
  },
  diamond: {
    n1: 1.0,
    n2: 2.42,
    name: "Air → Diamond",
    info:
      "Diamond has one of the highest refractive indices! This extreme bending and total internal reflection creates the brilliant sparkle we love.",
    topColor: "rgba(135, 206, 235, 0.05)",
    bottomColor: "rgba(147, 112, 219, 0.25)",
  },
};

function calculateRefractionAngle(
  incidentAngle: number,
  n1: number,
  n2: number
): number | null {
  const incidentRad = (incidentAngle * Math.PI) / 180;
  const sinRefracted = (n1 / n2) * Math.sin(incidentRad);
  if (Math.abs(sinRefracted) > 1) return null;
  return (Math.asin(sinRefracted) * 180) / Math.PI;
}

export default function ReflectionRefractionSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [angle, setAngle] = useState(45);
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.33);
  const [currentMedium, setCurrentMedium] = useState<keyof typeof MEDIUM_DATA>("air");
  const [mediumColors, setMediumColors] = useState({ top: MEDIUM_DATA.air.topColor, bottom: MEDIUM_DATA.air.bottomColor });
  const [showReflection, setShowReflection] = useState(true);
  const [showRefraction, setShowRefraction] = useState(true);
  const [showNormal, setShowNormal] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [showWavefronts, setShowWavefronts] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [demoActive, setDemoActive] = useState(false);
  const [sliderAngle, setSliderAngle] = useState(45);

  const displaySizeRef = useRef({ w: 800, h: 600 });
  const drawRef = useRef<() => void>(() => {});
  const progressRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const stateRef = useRef({
    running: false,
    demo: false,
    frameId: null as number | null,
    step: 0,
    time: 0,
  });
  const angleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const DEMO_STEP_TITLES = [
    "1. Incident ray",
    "2. Normal line",
    "3. Reflected ray",
    "4. Refracted ray",
    "5. Angle change",
    "6. Refractive index change",
    "7. Summary",
  ];

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const w = Math.max(container.clientWidth || 400, 100);
    const h = Math.max(container.clientHeight || 300, 100);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    displaySizeRef.current = { w, h };
    requestAnimationFrame(() => drawRef.current?.());
  }, []);

  useEffect(() => {
    resizeCanvas();
    const ro = containerRef.current ? new ResizeObserver(resizeCanvas) : null;
    if (containerRef.current && ro) ro.observe(containerRef.current);
    window.addEventListener("resize", resizeCanvas);
    const t1 = setTimeout(resizeCanvas, 0);
    const t2 = setTimeout(resizeCanvas, 150);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      ro?.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [resizeCanvas]);

  const doDraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    const { w: W, h: H } = displaySizeRef.current;
    if (W <= 0 || H <= 0) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const centerX = W * 0.5;
    const boundaryY = H * 0.5;
    const size = Math.min(W, H);
    const rayLength = size * 0.35;
    const baseFont = Math.max(12, size * 0.035);
    const arcRadius = size * 0.08;
    const arrowLen = size * 0.04;
    const waveSpacing = size * 0.075;
    const gridSpacing = size * 0.1;
    const lineW = Math.max(1, size * 0.004);
    const progress = progressRef.current;
    const isDemo = stateRef.current.demo;
    const demoStep = stateRef.current.step;
    const showIncidentRay = true;
    const showNormalLine = !isDemo ? showNormal : demoStep >= 1;
    const showReflectionRay = !isDemo ? showReflection : demoStep >= 2;
    const showRefractionRay = !isDemo ? showRefraction : demoStep >= 3;

    const incidentAngleRad = (angle * Math.PI) / 180;
    const refractedAngle = calculateRefractionAngle(angle, n1, n2);

    function drawGrid() {
      if (!showGrid) return;
      ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    function drawMediums() {
      ctx.fillStyle = mediumColors.top;
      ctx.fillRect(0, 0, W, boundaryY);
      ctx.fillStyle = mediumColors.bottom;
      ctx.fillRect(0, boundaryY, W, H - boundaryY);
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = Math.max(2, lineW * 1.5);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, boundaryY);
      ctx.lineTo(W, boundaryY);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${baseFont}px Arial`;
      ctx.textAlign = "left";
      ctx.fillText(`Medium 1 (n = ${n1.toFixed(2)})`, W * 0.05, H * 0.1);
      ctx.fillText(`Medium 2 (n = ${n2.toFixed(2)})`, W * 0.05, boundaryY + H * 0.1);
    }

    function drawNormal() {
      if (!showNormalLine) return;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = lineW;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ffffff";
      ctx.font = `${baseFont * 0.75}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("Normal", centerX, boundaryY - size * 0.08);
    }

    function drawRay(
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      color: string,
      width: number,
      animated: boolean,
      glow = false
    ) {
      const p = animated ? Math.min(progress, 1) : 1;
      const currentEndX = startX + (endX - startX) * p;
      const currentEndY = startY + (endY - startY) * p;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowBlur = glow ? 25 : 15;
      ctx.shadowColor = color;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentEndX, currentEndY);
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (p > 0.8) {
        const ang = Math.atan2(endY - startY, endX - startX);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(currentEndX, currentEndY);
        ctx.lineTo(
          currentEndX - arrowLen * Math.cos(ang - Math.PI / 6),
          currentEndY - arrowLen * Math.sin(ang - Math.PI / 6)
        );
        ctx.lineTo(
          currentEndX - arrowLen * Math.cos(ang + Math.PI / 6),
          currentEndY - arrowLen * Math.sin(ang + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawWavefronts(startX: number, startY: number, angleDeg: number, color: string) {
      if (!showWavefronts) return;
      const angleRad = (angleDeg * Math.PI) / 180;
      const perpLen = size * 0.05;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 5; i++) {
        const offset = i * waveSpacing + ((progress * waveSpacing) % waveSpacing);
        const perpAngle = angleRad + Math.PI / 2;
        const x1 = startX - Math.cos(angleRad) * offset + Math.cos(perpAngle) * perpLen;
        const y1 = startY - Math.sin(angleRad) * offset + Math.sin(perpAngle) * perpLen;
        const x2 = startX - Math.cos(angleRad) * offset - Math.cos(perpAngle) * perpLen;
        const y2 = startY - Math.sin(angleRad) * offset - Math.sin(perpAngle) * perpLen;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function drawAngleArc(
      cx: number,
      cy: number,
      startAngle: number,
      endAngle: number,
      label: string,
      color: string
    ) {
      if (!showAngles) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.beginPath();
      ctx.arc(cx, cy, arcRadius, startAngle, endAngle);
      ctx.stroke();
      const labelAngle = (startAngle + endAngle) / 2;
      const labelX = cx + Math.cos(labelAngle) * (arcRadius + size * 0.05);
      const labelY = cy + Math.sin(labelAngle) * (arcRadius + size * 0.05);
      ctx.fillStyle = color;
      ctx.font = `bold ${baseFont * 0.85}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(label, labelX, labelY);
    }

    drawGrid();
    drawMediums();
    drawNormal();

    const incidentStartX = centerX - Math.sin(incidentAngleRad) * rayLength;
    const incidentStartY = boundaryY - Math.cos(incidentAngleRad) * rayLength;
    const incidentGlow = isDemo && demoStep === 0;
    const normalGlow = isDemo && demoStep === 1;
    const reflectionGlow = isDemo && demoStep === 2;
    const refractionGlow = isDemo && demoStep === 3;

    drawRay(incidentStartX, incidentStartY, centerX, boundaryY, "#FFD700", lineW * 2, true, incidentGlow);
    if (showWavefronts && (showIncidentRay || !isDemo)) drawWavefronts(centerX, boundaryY, 180 - angle, "rgba(255, 215, 0, 0.5)");
    if (showAngles) drawAngleArc(
      centerX,
      boundaryY,
      -Math.PI / 2,
      -Math.PI / 2 + incidentAngleRad,
      `θᵢ = ${angle}°`,
      "#FFD700"
    );

    if (showReflectionRay) {
      const reflectedEndX = centerX + Math.sin(incidentAngleRad) * rayLength;
      const reflectedEndY = boundaryY - Math.cos(incidentAngleRad) * rayLength;
      drawRay(centerX, boundaryY, reflectedEndX, reflectedEndY, "#00BFFF", lineW * 1.5, true, reflectionGlow);
      if (showWavefronts) drawWavefronts(centerX, boundaryY, -angle, "rgba(0, 191, 255, 0.5)");
      if (showAngles) drawAngleArc(
        centerX,
        boundaryY,
        -Math.PI / 2,
        -Math.PI / 2 - incidentAngleRad,
        `θᵣ = ${angle}°`,
        "#00BFFF"
      );
    }

    if (showRefractionRay) {
      if (refractedAngle !== null) {
        const refractedAngleRad = (refractedAngle * Math.PI) / 180;
        const refractedEndX = centerX + Math.sin(refractedAngleRad) * rayLength;
        const refractedEndY = boundaryY + Math.cos(refractedAngleRad) * rayLength;
        drawRay(centerX, boundaryY, refractedEndX, refractedEndY, "#FF69B4", lineW * 1.5, true, refractionGlow);
        if (showWavefronts) drawWavefronts(centerX, boundaryY, 180 + refractedAngle, "rgba(255, 105, 180, 0.5)");
        if (showAngles) drawAngleArc(
          centerX,
          boundaryY,
          Math.PI / 2,
          Math.PI / 2 - refractedAngleRad,
          `θₜ = ${refractedAngle.toFixed(1)}°`,
          "#FF69B4"
        );
      } else {
        ctx.fillStyle = "#FF6B6B";
        ctx.font = `bold ${baseFont * 1.2}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText("⚠️ Total Internal Reflection!", centerX, boundaryY + size * 0.25);
      }
    }

    const dotRadius = size * 0.02;
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ffff";
    ctx.beginPath();
    ctx.arc(centerX, boundaryY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (isDemo && demoStep <= 6) {
      const title = DEMO_STEP_TITLES[demoStep];
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(W * 0.5 - 120, 8, 240, 32);
      ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(W * 0.5 - 120, 8, 240, 32);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(14, baseFont)}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(title, W * 0.5, 28);
    }
  }, [
    angle,
    n1,
    n2,
    mediumColors,
    showReflection,
    showRefraction,
    showNormal,
    showAngles,
    showWavefronts,
    showGrid,
  ]);

  useEffect(() => {
    drawRef.current = doDraw;
    doDraw();
  }, [doDraw]);

  progressRef.current = animationProgress;

  useEffect(() => {
    setSliderAngle(angle);
  }, [angle]);

  const next = useCallback(() => {
    stateRef.current.step++;
    stateRef.current.time = 0;
  }, []);

  const runDemo = useCallback((dt: number) => {
    const state = stateRef.current;
    state.time += dt;
    switch (state.step) {
      case 0:
        if (state.time > 1.5) next();
        break;
      case 1:
        if (state.time > 2) next();
        break;
      case 2:
        if (state.time > 2) next();
        break;
      case 3:
        if (state.time > 2) next();
        break;
      case 4: {
        const t = Math.min(1, state.time / 3);
        const a = Math.round(45 + t * 25);
        setAngle(a);
        setSliderAngle(a);
        if (state.time > 3) next();
        break;
      }
      case 5: {
        if (state.time > 1.5 && state.time - dt < 1.5) {
          setCurrentMedium("water");
          setN1(1.33);
          setN2(1.52);
          setMediumColors({ top: MEDIUM_DATA.water.topColor, bottom: MEDIUM_DATA.water.bottomColor });
        }
        if (state.time > 3) next();
        break;
      }
      case 6:
        if (state.time > 2.5) next();
        break;
      case 7:
        state.demo = false;
        state.step = 0;
        state.time = 0;
        setDemoActive(false);
        break;
      default:
        break;
    }
  }, [next]);

  const animate = useCallback((timestamp: number) => {
    const state = stateRef.current;
    if (!state.running) return;
    const dt = lastTimeRef.current != null ? (timestamp - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = timestamp;
    if (state.demo) {
      runDemo(dt);
    } else {
      const nextProgress = progressRef.current + 0.02;
      progressRef.current = nextProgress > 2 ? 0 : nextProgress;
      setAnimationProgress(progressRef.current);
    }
    drawRef.current?.();
    state.frameId = requestAnimationFrame(animate);
  }, [runDemo]);

  useEffect(() => {
    stateRef.current.running = isPlaying;
    if (isPlaying) {
      if (stateRef.current.frameId == null) {
        lastTimeRef.current = null;
        stateRef.current.frameId = requestAnimationFrame(animate);
      }
    } else {
      if (stateRef.current.frameId !== null) {
        cancelAnimationFrame(stateRef.current.frameId);
        stateRef.current.frameId = null;
      }
    }
  }, [isPlaying, animate]);

  const setPreset = useCallback((key: keyof typeof MEDIUM_DATA) => {
    if (stateRef.current.demo) return;
    setCurrentMedium(key);
    const d = MEDIUM_DATA[key];
    setN1(d.n1);
    setN2(d.n2);
    setMediumColors({ top: d.topColor, bottom: d.bottomColor });
  }, []);

  const onPlay = useCallback(() => {
    if (stateRef.current.demo) {
      stateRef.current.demo = false;
      stateRef.current.step = 0;
      stateRef.current.time = 0;
      setDemoActive(false);
    }
    setIsPlaying(true);
  }, []);

  const onPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const onReset = useCallback(() => {
    if (stateRef.current.frameId !== null) {
      cancelAnimationFrame(stateRef.current.frameId);
      stateRef.current.frameId = null;
    }
    stateRef.current.running = false;
    stateRef.current.demo = false;
    stateRef.current.step = 0;
    stateRef.current.time = 0;
    setDemoActive(false);
    setAngle(45);
    setN1(1.0);
    setN2(1.33);
    setCurrentMedium("air");
    setMediumColors({ top: MEDIUM_DATA.air.topColor, bottom: MEDIUM_DATA.air.bottomColor });
    progressRef.current = 0;
    setAnimationProgress(0);
    setSliderAngle(45);
    requestAnimationFrame(() => drawRef.current?.());
  }, []);

  const onDemo = useCallback(() => {
    const state = stateRef.current;
    if (state.demo) {
      state.demo = false;
      state.step = 0;
      state.time = 0;
      setDemoActive(false);
      return;
    }
    if (state.frameId != null) {
      cancelAnimationFrame(state.frameId);
      state.frameId = null;
    }
    setAngle(45);
    setN1(1.0);
    setN2(1.33);
    setCurrentMedium("air");
    setMediumColors({ top: MEDIUM_DATA.air.topColor, bottom: MEDIUM_DATA.air.bottomColor });
    setSliderAngle(45);
    progressRef.current = 0;
    setAnimationProgress(0);
    state.demo = true;
    state.running = true;
    state.step = 0;
    state.time = 0;
    setDemoActive(true);
    lastTimeRef.current = null;
    setIsPlaying(true);
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 items-stretch overflow-hidden" style={{ height: "100%", minHeight: 0 }}>
      {/* Simulator container: flex column, flex-1, fills available height */}
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{ flex: "0 0 75%", maxWidth: "75%", minWidth: 0, height: "100%" }}
      >
        <div className="shrink-0 rounded-t-xl border-b border-cyan-500/20 bg-white/5 px-3 py-1.5 text-center">
          <h1 className="text-lg font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            🌟 Reflection & Refraction Interactive Simulator
          </h1>
          <p className="text-xs text-cyan-200/90">
            Explore how light behaves at boundaries between different media
          </p>
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 flex-1 overflow-hidden rounded-b-xl border-2 border-t-0 border-cyan-500/30 bg-[radial-gradient(circle_at_center,_#0f1828_0%,_#060a15_100%)] shadow-[0_0_30px_rgba(0,255,255,0.2)]"
          style={{ cursor: "crosshair", flex: 1, height: "100%", position: "relative" }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 block" style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
      </div>

      {/* Control panel - right: 25%, full height via align-items: stretch */}
      <aside
        className="flex w-[25%] min-w-0 shrink-0 flex-col overflow-y-auto border-l-2 border-cyan-500/30 bg-[rgba(15,20,35,0.95)] p-4 shadow-[-5px_0_20px_rgba(0,0,0,0.5)]"
        style={{ minWidth: "22%", maxWidth: "25%" }}
      >
        <section className="mb-6 rounded-xl border border-cyan-500/15 bg-white/[0.03] p-5">
          <h3 className="mb-4 border-b-2 border-cyan-500/30 pb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            ⚡ Simulation Controls
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onPlay}
              disabled={demoActive}
              className="flex-1 rounded-md bg-gradient-to-br from-cyan-400 to-cyan-600 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-slate-900 shadow-[0_4px_15px_rgba(0,255,255,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,255,255,0.5)] disabled:opacity-60 disabled:pointer-events-none"
            >
              ▶ Play
            </button>
            <button
              type="button"
              onClick={onPause}
              disabled={demoActive}
              className="flex-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold uppercase text-cyan-400 transition hover:bg-cyan-500/20 disabled:opacity-60 disabled:pointer-events-none"
            >
              ⏸ Pause
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold uppercase text-cyan-400 transition hover:bg-cyan-500/20"
            >
              🔄 Reset
            </button>
            <button
              type="button"
              onClick={onDemo}
              className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-semibold uppercase transition ${
                demoActive
                  ? "border-amber-500/50 bg-amber-500/20 text-amber-200"
                  : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
              }`}
            >
              {demoActive ? "⏹ Stop Demo" : "🎬 Demo Mode"}
            </button>
          </div>
        </section>

        <section className={`mb-6 rounded-xl border border-cyan-500/15 bg-white/[0.03] p-5 transition-opacity ${demoActive ? "pointer-events-none opacity-60" : ""}`}>
          <h3 className="mb-4 border-b-2 border-cyan-500/30 pb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            👁️ Visibility Options
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { id: "showReflection", label: "Show Reflection Ray", checked: showReflection, set: setShowReflection },
              { id: "showRefraction", label: "Show Refraction Ray", checked: showRefraction, set: setShowRefraction },
              { id: "showNormal", label: "Show Normal Line", checked: showNormal, set: setShowNormal },
              { id: "showAngles", label: "Show Angle Labels", checked: showAngles, set: setShowAngles },
              { id: "showWavefronts", label: "Show Wavefronts", checked: showWavefronts, set: setShowWavefronts },
              { id: "showGrid", label: "Show Grid", checked: showGrid, set: setShowGrid },
            ].map(({ id, label, checked, set: setter }) => (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-cyan-500/10"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setter(e.target.checked)}
                  className="h-[18px] w-[18px] accent-cyan-400"
                />
                <span className="text-sm text-cyan-100">{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={`mb-6 rounded-xl border border-cyan-500/15 bg-white/[0.03] p-5 transition-opacity ${demoActive ? "pointer-events-none opacity-60" : ""}`}>
          <h3 className="mb-4 border-b-2 border-cyan-500/30 pb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            📐 Angle Control
          </h3>
          <div className="flex justify-between text-sm text-cyan-200">
            <span>Incident Angle (θᵢ)</span>
            <span className="font-semibold text-cyan-400">{sliderAngle}°</span>
          </div>
          <input
            type="range"
            min={5}
            max={85}
            step={1}
            value={sliderAngle}
            disabled={demoActive}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSliderAngle(v);
              if (angleDebounceRef.current !== null) clearTimeout(angleDebounceRef.current);
              angleDebounceRef.current = setTimeout(() => {
                setAngle(v);
                angleDebounceRef.current = null;
              }, 80);
            }}
            onMouseUp={() => {
              if (angleDebounceRef.current !== null) clearTimeout(angleDebounceRef.current);
              angleDebounceRef.current = null;
              setAngle(sliderAngle);
            }}
            onTouchEnd={() => {
              if (angleDebounceRef.current !== null) clearTimeout(angleDebounceRef.current);
              angleDebounceRef.current = null;
              setAngle(sliderAngle);
            }}
            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-cyan-500/20 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,255,255,0.5)] disabled:opacity-60"
          />
        </section>

        <section className={`rounded-xl border border-cyan-500/15 bg-white/[0.03] p-5 transition-opacity ${demoActive ? "pointer-events-none opacity-60" : ""}`}>
          <h3 className="mb-4 border-b-2 border-cyan-500/30 pb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            💧 Medium Selection
          </h3>
          <div className="flex flex-col gap-2">
            {(["air", "water", "glass", "diamond"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  currentMedium === key
                    ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_25px_rgba(0,255,255,0.2)]"
                    : "border-cyan-500/20 bg-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10"
                }`}
              >
                <div className="font-semibold text-cyan-400">{MEDIUM_DATA[key].name}</div>
                <div className="mt-0.5 text-xs text-cyan-200/80">
                  n₁ = {MEDIUM_DATA[key].n1.toFixed(2)} → n₂ = {MEDIUM_DATA[key].n2.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4">
            <div className="mb-2 font-semibold text-amber-400">💡 Did You Know?</div>
            <div className="text-sm leading-relaxed text-amber-100/90">
              {MEDIUM_DATA[currentMedium].info}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
