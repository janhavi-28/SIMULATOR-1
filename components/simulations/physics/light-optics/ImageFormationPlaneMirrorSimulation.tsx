"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { OpticsShell, SliderControl } from "./OpticsShell";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

const DEFAULT_OBJECT_X = 0.28;
const MIRROR_X = 0.5;
const OBJECT_X_MIN = 0.15;
const OBJECT_X_MAX = 0.48;
const RAY_ANIM_DURATION_MS = 900;
const IMAGE_FADE_MS = 400;
const DEMO_CYCLE_MS = 4000;
const LERP_SPEED = 12;
const OBJ_SCALE = 1.25;

type ObjectType = "candle" | "arrow" | "human" | "pencil";

type ConceptStep = 1 | 2 | 3 | 4 | null;

export default function ImageFormationPlaneMirrorSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [phase, setPhase] = useState(0);
  const [objectX, setObjectX] = useState(DEFAULT_OBJECT_X);
  const [objectH, setObjectH] = useState(0.14);
  const [objectType, setObjectType] = useState<ObjectType>("arrow");
  const [showRays, setShowRays] = useState(true);
  const [showObjectDistance, setShowObjectDistance] = useState(false);
  const [showImageDistance, setShowImageDistance] = useState(false);
  const [showExtensions, setShowExtensions] = useState(true);
  const [showNormals, setShowNormals] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [conceptMode, setConceptMode] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [dragState, setDragState] = useState<{ startX: number; startObjX: number } | null>(null);
  const [rayProgress, setRayProgress] = useState(0);
  const displayObjectXRef = useRef(DEFAULT_OBJECT_X);
  const lastTsRef = useRef<number | null>(null);
  const rayStartRef = useRef<number | null>(null);
  const demoStartTimeRef = useRef(0);

  const imageX = MIRROR_X + (MIRROR_X - objectX);
  const distObj = MIRROR_X - objectX;
  const distImg = imageX - MIRROR_X;

  const displayObjectX = displayObjectXRef.current;
  const displayImageX = MIRROR_X + (MIRROR_X - displayObjectX);
  const displayDistObj = MIRROR_X - displayObjectX;
  const displayDistImg = displayImageX - MIRROR_X;
  const distancesEqual = Math.abs(displayDistObj - displayDistImg) < 0.005;

  const launch = useCallback(() => {
    setPaused(false);
    setHasLaunched(true);
    setDemoRunning(false);
    rayStartRef.current = performance.now();
  }, []);

  const reset = useCallback(() => {
    setPaused(true);
    setHasLaunched(false);
    setDemoRunning(false);
    setObjectX(DEFAULT_OBJECT_X);
    displayObjectXRef.current = DEFAULT_OBJECT_X;
    setRayProgress(0);
    rayStartRef.current = null;
  }, []);

  const runDemo = useCallback(() => {
    setDemoRunning(true);
    setHasLaunched(true);
    setPaused(false);
    demoStartTimeRef.current = performance.now();
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTsRef.current != null ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;
      setPhase((p) => p + dt * 0.4);

      if (demoRunning) {
        const elapsed = ts - demoStartTimeRef.current;
        const t = (elapsed % DEMO_CYCLE_MS) / DEMO_CYCLE_MS;
        const x = OBJECT_X_MIN + (OBJECT_X_MAX - OBJECT_X_MIN) * (t < 0.5 ? t * 2 : 2 - t * 2);
        setObjectX(x);
      }

      displayObjectXRef.current = lerp(
        displayObjectXRef.current,
        objectX,
        dt * LERP_SPEED
      );

      if (hasLaunched && !paused && rayStartRef.current != null) {
        const elapsed = ts - rayStartRef.current;
        const p = Math.min(1, elapsed / RAY_ANIM_DURATION_MS);
        setRayProgress(easeOutCubic(p));
        if (p >= 1) rayStartRef.current = null;
      }
    };
    raf = requestAnimationFrame((t) => {
      lastTsRef.current = t;
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [hasLaunched, paused, objectX, demoRunning]);

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

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      const el = containerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return (e.clientX - rect.left) / rect.width;
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const xNorm = getCanvasCoords(e);
      if (xNorm == null) return;
      const w = containerRef.current?.getBoundingClientRect().width ?? 1;
      const objPx = w * displayObjectX;
      const hitPx = w * xNorm;
      if (Math.abs(hitPx - objPx) < 48) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragState({ startX: xNorm, startObjX: objectX });
      }
    },
    [getCanvasCoords, displayObjectX, objectX]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;
      const xNorm = getCanvasCoords(e);
      if (xNorm == null) return;
      const dx = xNorm - dragState.startX;
      const newX = Math.max(
        OBJECT_X_MIN,
        Math.min(OBJECT_X_MAX, dragState.startObjX + dx)
      );
      setObjectX(newX);
    },
    [dragState, getCanvasCoords]
  );

  const handlePointerUp = useCallback(() => setDragState(null), []);

  const conceptStep: ConceptStep = useMemo(() => {
    if (!conceptMode || !hasLaunched) return null;
    if (rayProgress < 0.45) return 1;
    if (rayProgress < 0.7) return 2;
    if (rayProgress < 0.9) return 3;
    return 4;
  }, [conceptMode, hasLaunched, rayProgress]);

  const imageAlpha = useMemo(() => {
    if (!hasLaunched) return 0.6;
    const fadeStart = 1 - IMAGE_FADE_MS / RAY_ANIM_DURATION_MS;
    if (rayProgress < fadeStart) return 0;
    const fadeT = (rayProgress - fadeStart) / (IMAGE_FADE_MS / RAY_ANIM_DURATION_MS);
    return Math.min(0.9, easeOutCubic(fadeT) * 0.9);
  }, [hasLaunched, rayProgress]);

  const intersectionGlow = useMemo(() => {
    if (!hasLaunched || rayProgress < 0.75) return 0;
    const t = (rayProgress - 0.75) / 0.25;
    return Math.min(1, t * 1.5) * (0.5 + 0.3 * Math.sin(phase * 3));
  }, [hasLaunched, rayProgress, phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const dpr = canvas.width / (containerRef.current?.getBoundingClientRect().width || 1);
    const cy = h / 2;
    const mirrorPx = w * MIRROR_X;
    const objPx = w * displayObjectX;
    const imgPx = w * displayImageX;
    const objH = h * objectH * OBJ_SCALE;
    const shimmer = 0.94 + 0.06 * Math.sin(phase * 2);

    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0a0f1a");
    bg.addColorStop(1, "#050810");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.08;
    const gridStep = 24 * dpr;
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();

    const drawObjectIcon = (
      cx: number,
      baseY: number,
      height: number,
      fill: string,
      stroke: string,
      alpha: number,
      mirror = false
    ) => {
      const scale = height / 80;
      const flip = mirror ? -1 : 1;
      ctx.save();
      ctx.translate(cx, baseY);
      ctx.scale(flip, 1);
      ctx.translate(-cx, -baseY);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2 * dpr;

      if (objectType === "arrow") {
        const tipY = baseY - height / 2;
        ctx.beginPath();
        ctx.moveTo(cx, baseY);
        ctx.lineTo(cx, tipY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, tipY - 14 * scale);
        ctx.lineTo(cx - 12 * scale, tipY);
        ctx.lineTo(cx + 12 * scale, tipY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (objectType === "candle") {
        const waxH = height * 0.7;
        const wickH = height * 0.25;
        const flameH = height * 0.2;
        const left = cx - height * 0.12;
        const top = baseY - waxH / 2;
        ctx.fillRect(left, top, height * 0.24, waxH);
        ctx.strokeRect(left, top, height * 0.24, waxH);
        ctx.strokeStyle = "#374151";
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(cx, top);
        ctx.lineTo(cx, top - wickH);
        ctx.stroke();
        ctx.fillStyle = "#fbbf24";
        ctx.strokeStyle = "#f59e0b";
        ctx.beginPath();
        ctx.ellipse(cx, top - wickH - flameH / 2, height * 0.1, flameH / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (objectType === "human") {
        const headR = height * 0.15;
        const bodyW = height * 0.2;
        const baseW = height * 0.35;
        const top = baseY - height / 2;
        const headY = top + headR;
        const bodyTop = headY + headR * 0.5;
        const bodyBottom = baseY - height / 2 + height * 0.4;
        const baseY2 = baseY + height / 2;
        ctx.beginPath();
        ctx.moveTo(cx - baseW / 2, baseY2);
        ctx.lineTo(cx, bodyBottom);
        ctx.lineTo(cx + baseW / 2, baseY2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - bodyW / 2, bodyTop);
        ctx.lineTo(cx - bodyW / 2, bodyBottom);
        ctx.lineTo(cx, bodyBottom + height * 0.05);
        ctx.lineTo(cx + bodyW / 2, bodyBottom);
        ctx.lineTo(cx + bodyW / 2, bodyTop);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, headY, headR, headR * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        const tipY = baseY - height / 2;
        const bodyW = height * 0.2;
        ctx.beginPath();
        ctx.moveTo(cx - bodyW / 2, baseY + bodyW);
        ctx.lineTo(cx - bodyW / 2, tipY + 8 * scale);
        ctx.lineTo(cx, tipY);
        ctx.lineTo(cx + bodyW / 2, tipY + 8 * scale);
        ctx.lineTo(cx + bodyW / 2, baseY + bodyW);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(cx - bodyW / 2 - 2, baseY + bodyW, bodyW + 4, height * 0.15);
      }
      ctx.restore();
    };

    const tipY = cy - objH / 2;
    const hitYTop = tipY - 22;
    const hitYBot = cy + objH / 2 + 22;
    const virtualExtend = 90 * dpr;
    const incProgress = hasLaunched ? Math.min(1, rayProgress * 1.15) : 1;
    const reflProgress = hasLaunched
      ? rayProgress > 0.35
        ? Math.min(1, (rayProgress - 0.35) / 0.45)
        : 0
      : 1;
    const virtualProgress = hasLaunched
      ? rayProgress > 0.8
        ? Math.min(1, (rayProgress - 0.8) / 0.2)
        : 0
      : 1;
    const photonT = hasLaunched ? rayProgress : 0.5;

    const drawRay = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      style: "incident" | "reflected" | "virtual",
      progress: number,
      drawPhoton: boolean
    ) => {
      const ex = x0 + (x1 - x0) * progress;
      const ey = y0 + (y1 - y0) * progress;

      ctx.setLineDash(style === "virtual" ? [10 * dpr, 8 * dpr] : []);

      if (style === "incident") {
        ctx.shadowColor = "rgba(251,191,36,0.9)";
        ctx.shadowBlur = 10 * dpr;
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3 * dpr;
      } else if (style === "reflected") {
        ctx.shadowColor = "rgba(255,255,255,0.7)";
        ctx.shadowBlur = 10 * dpr;
        ctx.strokeStyle = "rgba(255,255,255,0.98)";
        ctx.lineWidth = 3 * dpr;
      } else {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(34,211,238,0.85)";
        ctx.lineWidth = 2.5 * dpr;
      }

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (drawPhoton && progress > 0.05 && progress < 1) {
        ctx.beginPath();
        ctx.arc(ex, ey, 4 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = style === "incident" ? "#fef08a" : "rgba(255,255,255,0.95)";
        ctx.shadowColor = style === "incident" ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.8)";
        ctx.shadowBlur = 8 * dpr;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    if (showRays) {
      drawRay(
        objPx, tipY,
        mirrorPx, hitYTop,
        "incident", incProgress,
        hasLaunched && photonT < 0.42
      );
      drawRay(
        mirrorPx, hitYTop,
        imgPx, hitYTop - (hitYTop - cy) * 0.08,
        "reflected", reflProgress,
        hasLaunched && photonT >= 0.38 && photonT < 0.9
      );
      if (showExtensions) {
        const reflEndX = mirrorPx + (imgPx - mirrorPx) * reflProgress;
        const reflEndY = hitYTop - (hitYTop - cy) * 0.08 * reflProgress;
        drawRay(
          reflEndX, reflEndY,
          reflEndX + virtualExtend * virtualProgress, reflEndY,
          "virtual", virtualProgress,
          false
        );
      }

      drawRay(
        objPx, cy + objH / 2,
        mirrorPx, hitYBot,
        "incident", incProgress,
        hasLaunched && photonT < 0.42
      );
      drawRay(
        mirrorPx, hitYBot,
        imgPx, hitYBot + (cy - hitYBot) * 0.08,
        "reflected", reflProgress,
        hasLaunched && photonT >= 0.38 && photonT < 0.9
      );
      if (showExtensions) {
        const reflEndX2 = mirrorPx + (imgPx - mirrorPx) * reflProgress;
        const reflEndY2 = hitYBot + (cy - hitYBot) * 0.08 * reflProgress;
        ctx.setLineDash([10 * dpr, 8 * dpr]);
        ctx.strokeStyle = "rgba(34,211,238,0.85)";
        ctx.lineWidth = 2.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(reflEndX2, reflEndY2);
        ctx.lineTo(reflEndX2 + virtualExtend * virtualProgress, reflEndY2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (incProgress > 0.95 && reflProgress < 0.1) {
        ctx.beginPath();
        ctx.arc(mirrorPx, hitYTop, 6 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - reflProgress)})`;
        ctx.shadowColor = "rgba(255,255,255,0.6)";
        ctx.shadowBlur = 6 * dpr;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    ctx.fillStyle = "rgba(34,211,238,0.14)";
    ctx.fillRect(mirrorPx - 8, 0, 16, h);
    const edgeGrad = ctx.createLinearGradient(mirrorPx - 28, 0, mirrorPx + 28, 0);
    edgeGrad.addColorStop(0, "rgba(34,211,238,0)");
    edgeGrad.addColorStop(0.35, `rgba(34,211,238,${0.18 * shimmer})`);
    edgeGrad.addColorStop(0.5, `rgba(34,211,238,${0.42 * shimmer})`);
    edgeGrad.addColorStop(0.65, `rgba(34,211,238,${0.18 * shimmer})`);
    edgeGrad.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(mirrorPx - 28, 0, 56, h);
    ctx.strokeStyle = `rgba(34,211,238,${0.78 + 0.18 * Math.sin(phase)})`;
    ctx.lineWidth = 3 * dpr;
    ctx.shadowColor = "rgba(34,211,238,0.6)";
    ctx.shadowBlur = 16 * dpr;
    ctx.beginPath();
    ctx.moveTo(mirrorPx, 0);
    ctx.lineTo(mirrorPx, h);
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (showNormals) {
      const normLen = 30 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.strokeStyle = "rgba(148,163,184,0.5)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(mirrorPx, hitYTop - normLen);
      ctx.lineTo(mirrorPx, hitYTop + normLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mirrorPx, hitYBot - normLen);
      ctx.lineTo(mirrorPx, hitYBot + normLen);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (showExtensions && (showRays || showLabels)) {
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.strokeStyle = "rgba(148,163,184,0.3)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(objPx, cy);
      ctx.lineTo(imgPx, cy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (intersectionGlow > 0) {
      ctx.beginPath();
      ctx.arc(imgPx, cy, 20 * dpr, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(imgPx, cy, 0, imgPx, cy, 24 * dpr);
      g.addColorStop(0, `rgba(34,211,238,${0.4 * intersectionGlow})`);
      g.addColorStop(0.6, `rgba(34,211,238,${0.15 * intersectionGlow})`);
      g.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = g;
      ctx.fill();
    }

    drawObjectIcon(objPx, cy, objH, "#fef08a", "rgba(254,240,138,0.9)", 1, false);

    ctx.save();
    ctx.globalAlpha = imageAlpha;
    ctx.shadowColor = "rgba(226,232,240,0.7)";
    ctx.shadowBlur = 20 * dpr;
    drawObjectIcon(
      imgPx, cy, objH,
      "rgba(226,232,240,0.9)",
      "rgba(226,232,240,0.55)",
      0.92,
      true
    );
    ctx.restore();

    const lineY = cy - 50 * dpr;
    const uPulse = distancesEqual ? 0.5 + 0.4 * Math.sin(phase * 4) : 1;
    const midU = (objPx + mirrorPx) / 2;
    const midV = (mirrorPx + imgPx) / 2;

    if (showObjectDistance || showImageDistance) {
      ctx.setLineDash([6 * dpr, 5 * dpr]);
      ctx.strokeStyle = "rgba(251,191,36,0.45)";
      ctx.lineWidth = 2 * dpr;
      if (showObjectDistance) {
        ctx.beginPath();
        ctx.moveTo(objPx, lineY);
        ctx.lineTo(mirrorPx, lineY);
        ctx.stroke();
      }
      if (showImageDistance) {
        ctx.beginPath();
        ctx.moveTo(mirrorPx, lineY - (showObjectDistance ? 12 * dpr : 0));
        ctx.lineTo(imgPx, lineY - (showObjectDistance ? 12 * dpr : 0));
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.font = `bold ${13 * dpr}px system-ui`;
      if (showObjectDistance) {
        ctx.fillStyle = `rgba(251,191,36,${0.95 * uPulse})`;
        ctx.fillText(`u = ${(displayDistObj * 100).toFixed(0)}`, midU - 24, lineY - 8);
      }
      if (showImageDistance) {
        const vLineY = lineY - (showObjectDistance ? 12 * dpr : 0);
        ctx.fillStyle = `rgba(251,191,36,${0.95 * uPulse})`;
        ctx.fillText(`v = ${(displayDistImg * 100).toFixed(0)}`, midV - 24, vLineY - 8);
      }
    }

    if (showLabels) {
      ctx.fillStyle = "rgba(226,232,240,0.95)";
      ctx.font = `${12 * dpr}px system-ui`;
      const objLabelY = tipY - (showObjectDistance || showImageDistance ? 28 : 14);
      const imgLabelY = tipY - (showObjectDistance || showImageDistance ? 28 : 14);
      ctx.fillText("Object", objPx - 32, objLabelY);
      ctx.fillText("Image (virtual)", imgPx + 12, imgLabelY);
    }

    if (distancesEqual && (showObjectDistance || showImageDistance)) {
      ctx.fillStyle = "rgba(34,211,238,0.95)";
      ctx.font = `${11 * dpr}px system-ui`;
      ctx.fillText("Image distance equals object distance", mirrorPx - 85, h - 14);
    }

    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.fillText("Erect, same size, virtual", mirrorPx - 56, h - 12);

    if (conceptMode && conceptStep != null) {
      const steps = [
        "Step 1: Ray travels to mirror",
        "Step 2: Ray reflects",
        "Step 3: Extensions meet",
        "Step 4: Image appears",
      ];
      ctx.fillStyle = "rgba(34,211,238,0.25)";
      ctx.fillRect(0, 0, w, 36 * dpr);
      ctx.fillStyle = "rgba(34,211,238,0.95)";
      ctx.font = `bold ${12 * dpr}px system-ui`;
      ctx.fillText(steps[conceptStep - 1], 16 * dpr, 24 * dpr);
    }
  }, [
    displayObjectX,
    displayImageX,
    objectH,
    objectType,
    showRays,
    showObjectDistance,
    showImageDistance,
    showExtensions,
    showNormals,
    showLabels,
    hasLaunched,
    rayProgress,
    phase,
    imageAlpha,
    intersectionGlow,
    distancesEqual,
    conceptMode,
    conceptStep,
  ]);

  const btnGlow = "hover:shadow-[0_0_14px_rgba(34,211,238,0.5)]";
  const btnActive = "active:scale-[0.98]";

  return (
    <OpticsShell
      title="Image Formation by Plane Mirror"
      subtitle="Drag the object. Launch to animate rays. Image distance = object distance."
      contentClassName="p-2"
      controlsInSidebar
      paused={paused}
      hasLaunched={hasLaunched}
      demoActive={demoRunning}
      sidebar={
        <>
          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            Controls
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={launch}
              disabled={hasLaunched}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${btnGlow} ${btnActive} ${
                hasLaunched
                  ? "border-neutral-600 bg-neutral-800/50 text-neutral-500 cursor-not-allowed opacity-70"
                  : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
              }`}
            >
              Launch
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              disabled={!hasLaunched}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${btnGlow} ${btnActive} ${
                !hasLaunched
                  ? "bg-neutral-800/60 text-neutral-500 cursor-not-allowed opacity-70"
                  : paused
                    ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 ring-2 ring-cyan-400/50"
                    : "bg-cyan-500/90 text-white ring-2 ring-cyan-400/60"
              }`}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={!hasLaunched}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${btnGlow} ${btnActive} ${
                !hasLaunched
                  ? "border-neutral-600 bg-neutral-800/50 text-neutral-500 cursor-not-allowed opacity-70"
                  : "border-neutral-600 bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={runDemo}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${btnGlow} ${btnActive} ${
                demoRunning
                  ? "border-violet-500/60 bg-violet-500/20 text-violet-200"
                  : "border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
              }`}
            >
              Demo
            </button>
          </div>

          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider pt-2">
            Parameters
          </h3>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Object type</label>
            <select
              value={objectType}
              onChange={(e) => setObjectType(e.target.value as ObjectType)}
              className="w-full rounded-lg border border-neutral-600 bg-neutral-800/80 px-3 py-2 text-sm text-neutral-200 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            >
              <option value="candle">Candle</option>
              <option value="arrow">Arrow</option>
              <option value="human">Human silhouette</option>
              <option value="pencil">Pencil</option>
            </select>
          </div>
          <SliderControl
            label="Object position"
            value={objectX}
            min={OBJECT_X_MIN}
            max={OBJECT_X_MAX}
            step={0.01}
            unit=""
            onChange={setObjectX}
          />
          <SliderControl
            label="Object height"
            value={objectH}
            min={0.08}
            max={0.22}
            step={0.01}
            unit=""
            onChange={setObjectH}
            color="amber"
          />

          <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider pt-2">
            Visualization
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showRays}
                onChange={(e) => setShowRays(e.target.checked)}
                className="rounded bg-neutral-700 border-neutral-600 text-cyan-500"
              />
              <span className="text-sm text-neutral-300">Show Rays</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showObjectDistance}
                onChange={(e) => setShowObjectDistance(e.target.checked)}
                className="rounded bg-neutral-700 border-neutral-600 text-cyan-500"
              />
              <span className="text-sm text-neutral-300">Show Object Distance</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showImageDistance}
                onChange={(e) => setShowImageDistance(e.target.checked)}
                className="rounded bg-neutral-700 border-neutral-600 text-cyan-500"
              />
              <span className="text-sm text-neutral-300">Show Image Distance</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showExtensions}
                onChange={(e) => setShowExtensions(e.target.checked)}
                className="rounded bg-neutral-700 border-neutral-600 text-cyan-500"
              />
              <span className="text-sm text-neutral-300">Show Extensions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showNormals}
                onChange={(e) => setShowNormals(e.target.checked)}
                className="rounded bg-neutral-700 border-neutral-600 text-cyan-500"
              />
              <span className="text-sm text-neutral-300">Show Normals</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="rounded bg-neutral-700 border-neutral-600 text-cyan-500"
              />
              <span className="text-sm text-neutral-300">Show Labels</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={conceptMode}
                onChange={(e) => setConceptMode(e.target.checked)}
                className="rounded bg-neutral-700 border-neutral-600 text-cyan-500"
              />
              <span className="text-sm text-neutral-300">Concept Mode</span>
            </label>
          </div>

          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            <div className="font-medium text-cyan-200 mb-1">Concept</div>
            <div>
              {distancesEqual
                ? "Image distance equals object distance (u = v)."
                : `As the object moves, the image moves so u and v stay equal. (u ≈ ${(displayDistObj * 100).toFixed(0)}, v ≈ ${(displayDistImg * 100).toFixed(0)})`}
            </div>
            <div className="mt-2 text-cyan-200/80 text-xs">
              Image is virtual, upright, same size. |u| = |v|.
            </div>
          </div>
        </>
      }
    >
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 w-full"
        style={{ minHeight: "clamp(520px, 68vh, 720px)" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: "100%", height: "100%" }}
          aria-hidden
        />
      </div>
    </OpticsShell>
  );
}
