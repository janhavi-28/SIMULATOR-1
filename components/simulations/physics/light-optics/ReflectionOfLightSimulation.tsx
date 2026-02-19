"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const GOLD = "#f5b842";
const CYAN = "#00d4ff";
const GREEN = "#3dd68c";
const VIOLET = "#b88aff";
const RED = "#ff5c7a";
const ORANGE = "#ff9f43";

function getBannerText(a: number) {
  if (a < 1) return "⚡ i = 0° — Normal Incidence (ray reflects straight back)";
  if (a > 80) return `⚡ i = r = ${a.toFixed(0)}° — Grazing incidence!`;
  return `⚡ i = r = ${a.toFixed(1)}° — Law of Reflection holds`;
}

function getObsContent(a: number): { msg: string; borderColor: string } {
  if (a < 1)
    return {
      msg: "Normal incidence (i = 0°): The ray hits the mirror head-on and reflects straight back along the same path. Total deflection = 180°.",
      borderColor: GREEN,
    };
  if (a < 30)
    return {
      msg: `Small angle (i = ${a.toFixed(0)}°): The reflected ray stays close to the incident ray. The two rays form a narrow V shape. Total angular spread = ${(2 * a).toFixed(0)}°.`,
      borderColor: CYAN,
    };
  if (a < 60)
    return {
      msg: `Medium angle (i = ${a.toFixed(0)}°): A clear V shape. Both rays make equal angles with the dashed normal. ∠i = ∠r = ${a.toFixed(0)}°.`,
      borderColor: GOLD,
    };
  if (a < 82)
    return {
      msg: `Large angle (i = ${a.toFixed(0)}°): The ray strikes the mirror at a steep angle. Incident and reflected rays are spread apart — total deflection = ${(2 * a).toFixed(0)}°.`,
      borderColor: ORANGE,
    };
  return {
    msg: "Grazing incidence (i ≈ 90°): The ray is nearly parallel to the mirror. Even a tiny surface imperfection scatters the ray drastically.",
    borderColor: RED,
  };
}

export default function ReflectionOfLightSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(35);
  const [playing, setPlaying] = useState(true);
  const [photon, setPhoton] = useState(0);
  const [demo, setDemo] = useState(false);
  const demoDirRef = useRef(1);
  const [surface, setSurface] = useState<"flat" | "curved">("flat");
  const [showIncident, setShowIncident] = useState(true);
  const [showReflected, setShowReflected] = useState(true);
  const [showNormal, setShowNormal] = useState(true);
  const [showArcs, setShowArcs] = useState(true);
  const [showMirror, setShowMirror] = useState(true);
  const [launchLabel, setLaunchLabel] = useState("▶ Launch");

  const pSpd = 0.006;

  const doLaunch = useCallback(() => {
    setPlaying(true);
    setPhoton(0);
    setLaunchLabel("↺ Relaunch");
  }, []);

  const doPlay = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  const doReset = useCallback(() => {
    setAngle(35);
    setPhoton(0);
    setPlaying(true);
    setDemo(false);
    demoDirRef.current = 1;
    setSurface("flat");
    setShowIncident(true);
    setShowReflected(true);
    setShowNormal(true);
    setShowArcs(true);
    setShowMirror(true);
    setLaunchLabel("▶ Launch");
  }, []);

  // Resize canvas
  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const resize = () => {
      canvas.width = el.clientWidth;
      canvas.height = el.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw loop + demo step
  useEffect(() => {
    let raf: number;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (demo) {
        setAngle((a) => {
          const d = demoDirRef.current;
          let next = a + d * 0.22;
          if (next >= 85) {
            demoDirRef.current = -1;
            return 85;
          }
          if (next <= 0) {
            demoDirRef.current = 1;
            return 0;
          }
          return next;
        });
      }
      if (playing) setPhoton((p) => (p + pSpd > 1 ? 0 : p + pSpd));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [demo, playing]);

  // Canvas draw
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || canvas.width === 0) return;

    const W = canvas.width;
    const H = canvas.height;
    const mX = W * 0.5;
    const mY = H * 0.58;
    const aRad = angle * (Math.PI / 180);
    const rayLen = H * 0.48;
    const incX1 = mX - rayLen * Math.sin(aRad);
    const incY1 = mY - rayLen * Math.cos(aRad);
    const refX2 = mX + rayLen * Math.sin(aRad);
    const refY2 = mY - rayLen * Math.cos(aRad);

    const gLine = (x1: number, y1: number, x2: number, y2: number, col: string, w: number) => {
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = col;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = col + "44";
      ctx.lineWidth = w + 5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.shadowBlur = 8;
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    const dashed = (x1: number, y1: number, x2: number, y2: number, col: string, w = 1.5, d: number[] = [6, 5]) => {
      ctx.save();
      ctx.setLineDash(d);
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    };

    const arrowTip = (x: number, y: number, ang: number, col: string, sz = 12) => {
      ctx.save();
      ctx.shadowColor = col;
      ctx.shadowBlur = 8;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - sz * Math.cos(ang - 0.36), y - sz * Math.sin(ang - 0.36));
      ctx.lineTo(x - sz * Math.cos(ang + 0.36), y - sz * Math.sin(ang + 0.36));
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const bgLabel = (txt: string, x: number, y: number, col: string, sz = 11) => {
      ctx.save();
      ctx.font = `600 ${sz}px 'JetBrains Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const w = ctx.measureText(txt).width;
      const r = 6,
        px = x - w / 2 - 6,
        py = y - sz / 2 - 5,
        pw = w + 12,
        ph = sz + 10;
      ctx.fillStyle = "rgba(5,11,20,.92)";
      ctx.strokeStyle = col + "55";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (typeof (ctx as CanvasRenderingContext2D & { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect === "function") {
        (ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(px, py, pw, ph, r);
      } else {
        ctx.rect(px, py, pw, ph);
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillText(txt, x, y);
      ctx.restore();
    };

    const glowDot = (x: number, y: number, col: string, r = 5) => {
      ctx.save();
      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const drawMirror = () => {
      const mW = W * 0.44;
      if (surface === "flat") {
        const mg = ctx.createLinearGradient(mX - mW, mY, mX + mW, mY);
        mg.addColorStop(0, "rgba(0,212,255,.0)");
        mg.addColorStop(0.15, "rgba(0,212,255,.55)");
        mg.addColorStop(0.5, "rgba(180,240,255,.9)");
        mg.addColorStop(0.85, "rgba(0,212,255,.55)");
        mg.addColorStop(1, "rgba(0,212,255,.0)");
        ctx.save();
        ctx.shadowColor = "rgba(0,212,255,.45)";
        ctx.shadowBlur = 18;
        ctx.strokeStyle = mg;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(mX - mW, mY);
        ctx.lineTo(mX + mW, mY);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = "rgba(0,212,255,.12)";
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        for (let i = -mW + 10; i < mW; i += 16) {
          ctx.beginPath();
          ctx.moveTo(mX + i, mY);
          ctx.lineTo(mX + i - 14, mY + 14);
          ctx.stroke();
        }
        ctx.restore();
      } else {
        const mg2 = ctx.createLinearGradient(mX - mW, mY, mX + mW, mY);
        mg2.addColorStop(0, "rgba(0,212,255,.0)");
        mg2.addColorStop(0.15, "rgba(0,212,255,.55)");
        mg2.addColorStop(0.5, "rgba(180,240,255,.9)");
        mg2.addColorStop(0.85, "rgba(0,212,255,.55)");
        mg2.addColorStop(1, "rgba(0,212,255,.0)");
        ctx.save();
        ctx.shadowColor = "rgba(0,212,255,.45)";
        ctx.shadowBlur = 16;
        ctx.strokeStyle = mg2;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const amp = 8,
          freq = mW / 3;
        ctx.moveTo(mX - mW, mY);
        for (let x = -mW; x <= mW; x += 2) {
          ctx.lineTo(mX + x, mY + Math.sin((x / freq) * Math.PI) * amp);
        }
        ctx.stroke();
        ctx.restore();
      }
    };

    ctx.clearRect(0, 0, W, H);

    if (showMirror) drawMirror();

    if (showNormal) {
      dashed(mX, mY - H * 0.3, mX, mY + H * 0.08, "rgba(184,138,255,.7)", 2, [7, 5]);
      bgLabel("Normal", mX, mY - H * 0.3 - 16, VIOLET, 10);
    }

    if (showArcs && angle > 0.5) {
      const R = 54,
        R2 = 44;
      ctx.save();
      ctx.strokeStyle = "rgba(245,184,66,.8)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(245,184,66,.5)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(mX, mY, R, -Math.PI / 2 - aRad, -Math.PI / 2);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "rgba(245,184,66,.07)";
      ctx.beginPath();
      ctx.moveTo(mX, mY);
      ctx.arc(mX, mY, R, -Math.PI / 2 - aRad, -Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      bgLabel("i=" + angle.toFixed(0) + "°", mX - R * Math.sin(aRad / 2) - 32, mY - R * Math.cos(aRad / 2), GOLD, 11);

      ctx.save();
      ctx.strokeStyle = "rgba(0,212,255,.8)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(0,212,255,.5)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(mX, mY, R2, -Math.PI / 2, -Math.PI / 2 + aRad);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "rgba(0,212,255,.07)";
      ctx.beginPath();
      ctx.moveTo(mX, mY);
      ctx.arc(mX, mY, R2, -Math.PI / 2, -Math.PI / 2 + aRad);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      bgLabel("r=" + angle.toFixed(0) + "°", mX + R2 * Math.sin(aRad / 2) + 32, mY - R2 * Math.cos(aRad / 2), CYAN, 11);
    }

    if (showIncident) {
      gLine(incX1, incY1, mX, mY, GOLD, 3);
      const mx2 = incX1 + (mX - incX1) * 0.55,
        my2 = incY1 + (mY - incY1) * 0.55;
      const ang = Math.atan2(mY - incY1, mX - incX1);
      arrowTip(mx2, my2, ang, GOLD);
      bgLabel("Incident Ray", incX1 + (mX - incX1) * 0.28, incY1 + (mY - incY1) * 0.28 - 18, GOLD, 11);
    }

    if (showReflected) {
      gLine(mX, mY, refX2, refY2, CYAN, 3);
      const mx2 = mX + (refX2 - mX) * 0.55,
        my2 = mY + (refY2 - mY) * 0.55;
      const ang = Math.atan2(refY2 - mY, refX2 - mX);
      arrowTip(mx2, my2, ang, CYAN);
      bgLabel("Reflected Ray", mX + (refX2 - mX) * 0.72, mY + (refY2 - mY) * 0.72 - 18, CYAN, 11);
    }

    glowDot(mX, mY, "rgba(255,255,255,.9)", 5);
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.beginPath();
    ctx.arc(mX, mY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (angle < 0.5) bgLabel("Reflects straight back", mX + 14, mY - H * 0.18, GREEN, 11);

    if (playing) {
      const p = photon;
      let px: number, py: number, pc: string;
      if (p < 0.5) {
        const t = p / 0.5;
        px = incX1 + (mX - incX1) * t;
        py = incY1 + (mY - incY1) * t;
        pc = GOLD;
      } else {
        const t = (p - 0.5) / 0.5;
        px = mX + (refX2 - mX) * t;
        py = mY + (refY2 - mY) * t;
        pc = CYAN;
      }
      const rg = ctx.createRadialGradient(px, py, 0, px, py, 15);
      rg.addColorStop(0, pc + "ff");
      rg.addColorStop(0.3, pc + "88");
      rg.addColorStop(1, pc + "00");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (angle > 0.5) bgLabel("∠i = ∠r = " + angle.toFixed(1) + "°", mX, mY + H * 0.1, "#ffffff", 12);
    else bgLabel("Normal incidence — ray reflects back", mX, mY + H * 0.1, GREEN, 11);
  }, [angle, playing, photon, surface, showIncident, showReflected, showNormal, showArcs, showMirror]);

  // Drag on canvas
  const dragRef = useRef(false);
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = true;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    []
  );
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const canvas = canvasRef.current;
      const mx = ((e.clientX - rect.left) * canvas.width) / rect.width;
      const my = ((e.clientY - rect.top) * canvas.height) / rect.height;
      const mX = canvas.width * 0.5,
        mY = canvas.height * 0.58;
      const dx = mx - mX,
        dy = mY - my;
      if (dy > 10) {
        const a = Math.max(0, Math.min(85, (Math.atan2(Math.abs(dx), dy) * 180) / Math.PI));
        setAngle(a);
      }
    },
    []
  );
  const handlePointerUp = useCallback(() => {
    dragRef.current = false;
  }, []);

  const obs = getObsContent(angle);
  const bannerText = getBannerText(angle);
  const bannerGreen = angle < 1;
  const bannerRed = angle > 80;

  return (
    <div className="flex h-full min-h-[480px] w-full flex-col rounded-xl overflow-hidden border border-neutral-700 bg-[#08111c] md:grid md:grid-cols-[1fr_320px]">
      <style>{`
        .reflection-slider {
          background: linear-gradient(to right, #f5b842 var(--p, 41%), rgba(245, 184, 66, 0.12) var(--p, 41%));
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 4px;
        }
        .reflection-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #050b14;
          background: #f5b842;
          box-shadow: 0 0 10px #f5b842;
          cursor: grab;
        }
        .reflection-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #050b14;
          background: #f5b842;
          box-shadow: 0 0 10px #f5b842;
          cursor: grab;
        }
      `}</style>
      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[300px] overflow-hidden bg-[#08111c]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% 20%, rgba(0, 210, 255, 0.04) 0%, transparent 55%),
            linear-gradient(rgba(0, 210, 255, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 210, 255, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 48px 48px, 48px 48px",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-crosshair"
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        <div
          className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full border px-6 py-2.5 text-center font-bold tracking-wide backdrop-blur-md"
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "12px",
            letterSpacing: "0.05em",
            borderColor: bannerGreen ? "rgba(61,214,140,.5)" : bannerRed ? "rgba(255,92,122,.5)" : "rgba(245,184,66,.5)",
            color: bannerGreen ? GREEN : bannerRed ? RED : GOLD,
            background: bannerGreen ? "rgba(61,214,140,.1)" : bannerRed ? "rgba(255,92,122,.1)" : "rgba(245,184,66,.08)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {bannerText}
        </div>
      </div>

      {/* Control panel */}
      <div className="flex max-h-[60vh] flex-col overflow-y-auto border-l border-[rgba(0,210,255,0.12)] bg-[#08111c] md:max-h-none">
        <div className="border-b border-[rgba(0,210,255,0.12)] bg-gradient-to-b from-[rgba(0,212,255,0.05)] to-transparent px-5 py-5 pb-4">
          <h2 className="font-extrabold tracking-tight text-white" style={{ fontFamily: "Syne, sans-serif", fontSize: "17px" }}>
            Reflection of Light
          </h2>
          <p className="mt-1.5 text-[11px] leading-snug text-[rgba(180,215,255,0.7)]">
            Angle of incidence equals angle of reflection. Drag the ray on the canvas or use the slider.
          </p>
          <div className="mt-3 rounded-lg border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.06)] px-3.5 py-2.5 font-mono text-[11px] leading-snug text-[#00d4ff]">
            ∠i = ∠r (Law of Reflection)
            <br />
            Both rays lie in the same plane
          </div>
        </div>

        <div className="border-b border-[rgba(0,210,255,0.12)] px-5 py-4">
          <div className="mb-3 flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[rgba(140,180,230,0.45)]">
            <span style={{ fontFamily: "Syne, sans-serif" }}>Playback</span>
            <span className="flex-1 border-t border-[rgba(0,210,255,0.12)]" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={doLaunch}
              className="flex-1 rounded-lg py-2.5 font-bold text-[#001a22] shadow-lg transition hover:-translate-y-px hover:shadow-xl"
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "11px",
                background: "linear-gradient(135deg, #00d4ff, #007a9e)",
                boxShadow: "0 2px 12px rgba(0, 212, 255, 0.25)",
              }}
            >
              {launchLabel}
            </button>
            <button
              type="button"
              onClick={doPlay}
              className={`flex-1 rounded-lg border py-2.5 font-bold text-[11px] transition ${playing ? "border-[#00d4ff] bg-[rgba(0,212,255,0.18)] text-[#00d4ff]" : "border-[rgba(0,210,255,0.12)] bg-[#0c1826] text-[rgba(180,215,255,0.7)] hover:border-[rgba(0,210,255,0.35)] hover:text-white"}`}
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {playing ? "⏸ Pause" : "▶ Play"}
            </button>
            <button
              type="button"
              onClick={doReset}
              className="flex-1 rounded-lg border border-[rgba(0,210,255,0.12)] bg-[#0c1826] py-2.5 font-bold text-[11px] text-[rgba(180,215,255,0.7)] transition hover:border-[#ff5c7a] hover:text-[#ff5c7a]"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              ↺ Reset
            </button>
          </div>
          <div
            className={`mt-2.5 flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 transition ${demo ? "border-[#f5b842] bg-[rgba(245,184,66,0.18)]" : "border-[rgba(0,210,255,0.12)] bg-[#0c1826] hover:border-[#f5b842] hover:bg-[rgba(245,184,66,0.18)]"}`}
            onClick={() => setDemo((d) => !d)}
          >
            <span className="text-lg">🎬</span>
            <div className="flex-1">
              <strong className="block text-[12px] font-medium text-white">Demo Mode</strong>
              <small className="text-[10px] text-[rgba(180,215,255,0.7)]">Auto-sweeps angle 0° → 85°</small>
            </div>
            <label className="relative inline-block h-5 w-[38px] shrink-0 cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="sr-only" />
              <span
                className={`block h-full rounded-full border transition ${demo ? "border-[#00d4ff] bg-[rgba(0,212,255,0.18)]" : "border-[rgba(0,210,255,0.12)] bg-white/[0.06]"}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full transition ${demo ? "translate-x-[18px] bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" : "bg-[rgba(140,180,230,0.45)]"}`}
                />
              </span>
            </label>
          </div>
        </div>

        <div className="border-b border-[rgba(0,210,255,0.12)] px-5 py-4">
          <div className="mb-2.5 flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[rgba(140,180,230,0.45)]">
            <span style={{ fontFamily: "Syne, sans-serif" }}>Parameters</span>
            <span className="flex-1 border-t border-[rgba(0,210,255,0.12)]" />
          </div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12px] text-[rgba(180,215,255,0.7)]">Angle of Incidence (i)</span>
            <span className="rounded-lg border border-[rgba(245,184,66,0.35)] bg-[rgba(245,184,66,0.18)] px-2.5 py-1 font-mono text-[14px] font-medium text-[#f5b842]">
              {angle.toFixed(1)}°
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={85}
            step={0.5}
            value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value))}
            className="reflection-slider h-1.5 w-full cursor-pointer appearance-none rounded"
            style={{ ["--p" as string]: `${(angle / 85) * 100}%` }}
          />
          <div className="mt-1.5 flex justify-between font-mono text-[9px] text-[rgba(140,180,230,0.45)]">
            <span>0° (normal)</span>
            <span>85° (grazing)</span>
          </div>
        </div>

        <div className="border-b border-[rgba(0,210,255,0.12)] px-5 py-4">
          <div className="mb-2.5 flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[rgba(140,180,230,0.45)]">
            <span style={{ fontFamily: "Syne, sans-serif" }}>Mirror Surface</span>
            <span className="flex-1 border-t border-[rgba(0,210,255,0.12)]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSurface("flat")}
              className={`rounded-lg border py-2.5 text-center text-[10.5px] font-bold transition ${surface === "flat" ? "border-[#00d4ff] bg-[rgba(0,212,255,0.18)] text-[#00d4ff]" : "border-[rgba(0,210,255,0.12)] bg-[#0c1826] text-[rgba(180,215,255,0.7)] hover:border-[rgba(0,210,255,0.35)] hover:text-white"}`}
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              🪞 Flat
            </button>
            <button
              type="button"
              onClick={() => setSurface("curved")}
              className={`rounded-lg border py-2.5 text-center text-[10.5px] font-bold transition ${surface === "curved" ? "border-[#00d4ff] bg-[rgba(0,212,255,0.18)] text-[#00d4ff]" : "border-[rgba(0,210,255,0.12)] bg-[#0c1826] text-[rgba(180,215,255,0.7)] hover:border-[rgba(0,210,255,0.35)] hover:text-white"}`}
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              🌀 Rippled
            </button>
          </div>
        </div>

        <div className="border-b border-[rgba(0,210,255,0.12)] px-5 py-4">
          <div className="mb-2.5 flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[rgba(140,180,230,0.45)]">
            <span style={{ fontFamily: "Syne, sans-serif" }}>Show / Hide</span>
            <span className="flex-1 border-t border-[rgba(0,210,255,0.12)]" />
          </div>
          {[
            { label: "Incident Ray", color: GOLD, checked: showIncident, set: setShowIncident },
            { label: "Reflected Ray", color: CYAN, checked: showReflected, set: setShowReflected },
            { label: "Normal Line", color: VIOLET, checked: showNormal, set: setShowNormal },
            { label: "Angle Arcs (i & r)", color: GREEN, checked: showArcs, set: setShowArcs },
            { label: "Mirror Surface", color: "rgba(0,212,255,0.5)", checked: showMirror, set: setShowMirror },
          ].map(({ label, color, checked, set }) => (
            <div key={label} className="mb-1.5 flex items-center justify-between rounded-lg bg-[#0c1826] px-3 py-2 last:mb-0">
              <div className="flex items-center gap-2.5 text-[12px] font-medium" style={{ color }}>
                <span className="h-0.5 w-7 shrink-0 rounded" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                {label}
              </div>
              <label className="relative inline-block h-5 w-[38px] cursor-pointer">
                <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="sr-only" />
                <span className={`block h-full rounded-full border transition ${checked ? "border-[#00d4ff] bg-[rgba(0,212,255,0.18)]" : "border-[rgba(0,210,255,0.12)] bg-white/[0.06]"}`}>
                  <span className={`absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full transition ${checked ? "translate-x-[18px] bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" : "bg-[rgba(140,180,230,0.45)]"}`} />
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="border-b border-[rgba(0,210,255,0.12)] px-5 py-4">
          <div className="mb-2.5 flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[rgba(140,180,230,0.45)]">
            <span style={{ fontFamily: "Syne, sans-serif" }}>Live Readings</span>
            <span className="flex-1 border-t border-[rgba(0,210,255,0.12)]" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <div className="rounded-lg border border-[rgba(245,184,66,0.35)] bg-[#0c1826] px-3.5 py-3">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[rgba(140,180,230,0.45)]" style={{ fontFamily: "Syne, sans-serif" }}>
                Angle i
              </div>
              <div className="font-mono text-2xl font-medium text-[#f5b842]">{angle.toFixed(1)}°</div>
            </div>
            <div className="rounded-lg border border-[rgba(0,212,255,0.35)] bg-[#0c1826] px-3.5 py-3">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[rgba(140,180,230,0.45)]" style={{ fontFamily: "Syne, sans-serif" }}>
                Angle r
              </div>
              <div className="font-mono text-2xl font-medium text-[#00d4ff]">{angle.toFixed(1)}°</div>
            </div>
          </div>
          <div className="rounded-lg border border-[rgba(61,214,140,0.35)] bg-[#0c1826] px-3.5 py-3">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[rgba(140,180,230,0.45)]" style={{ fontFamily: "Syne, sans-serif" }}>
              i + r (total deflection)
            </div>
            <div className="font-mono text-xl font-medium text-[#3dd68c]">{(2 * angle).toFixed(1)}°</div>
          </div>
        </div>

        <div className="border-b border-[rgba(0,210,255,0.12)] px-5 py-4">
          <div className="mb-2.5 flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[rgba(140,180,230,0.45)]">
            <span style={{ fontFamily: "Syne, sans-serif" }}>Laws of Reflection</span>
            <span className="flex-1 border-t border-[rgba(0,210,255,0.12)]" />
          </div>
          <div className="rounded-lg border border-[rgba(0,210,255,0.12)] bg-[#0c1826] p-4 flex gap-3 mb-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.18)] font-bold text-[13px] text-[#00d4ff]">1</div>
            <div className="text-[11.5px] leading-relaxed text-[rgba(180,215,255,0.7)]">
              <strong className="block text-white">First Law</strong> The incident ray, normal, and reflected ray all lie in the same plane.
            </div>
          </div>
          <div className="rounded-lg border border-[rgba(0,210,255,0.12)] bg-[#0c1826] p-4 flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.18)] font-bold text-[13px] text-[#00d4ff]">2</div>
            <div className="text-[11.5px] leading-relaxed text-[rgba(180,215,255,0.7)]">
              <strong className="block text-white">Second Law</strong> The angle of incidence (i) equals the angle of reflection (r): <span className="font-mono text-[12px] text-[#00d4ff]">∠i = ∠r</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="mb-2.5 flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[rgba(140,180,230,0.45)]">
            <span style={{ fontFamily: "Syne, sans-serif" }}>What&apos;s Happening?</span>
            <span className="flex-1 border-t border-[rgba(0,210,255,0.12)]" />
          </div>
          <div
            className="rounded-lg border border-[rgba(0,210,255,0.12)] py-3 pl-4 pr-4 text-[11.5px] leading-relaxed text-[rgba(180,215,255,0.7)]"
            style={{ borderLeftWidth: "4px", borderLeftColor: obs.borderColor }}
          >
            {obs.msg}
          </div>
        </div>
      </div>
    </div>
  );
}
