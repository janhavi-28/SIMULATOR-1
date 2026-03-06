"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface RollingObject {
  id: string; name: string;
  primary: string; highlight: string; shadow: string;
  beta: number; formula: string; description: string;
}

const OBJECTS: RollingObject[] = [
  { id:"solid-sphere",    name:"Solid Sphere",    primary:"#1a6fd4", highlight:"#7ec8ff", shadow:"#082060", beta:2/5, formula:"I = â…–MRÂ²",  description:"Î²=0.400" },
  { id:"solid-cylinder",  name:"Solid Cylinder",  primary:"#7c3aed", highlight:"#c4b5fd", shadow:"#2d0f60", beta:1/2, formula:"I = Â½MRÂ²",   description:"Î²=0.500" },
  { id:"hollow-sphere",   name:"Hollow Sphere",   primary:"#0891b2", highlight:"#a5f3fc", shadow:"#073344", beta:2/3, formula:"I = â…”MRÂ²",   description:"Î²=0.667" },
  { id:"hollow-cylinder", name:"Hollow Cylinder", primary:"#059669", highlight:"#a7f3d0", shadow:"#022c22", beta:1,   formula:"I = MRÂ²",    description:"Î²=1.000" },
  { id:"point-mass",      name:"Point Mass",      primary:"#d97706", highlight:"#fde68a", shadow:"#451a03", beta:0,   formula:"I = 0",      description:"Î²=0 (slides)" },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const calcAccel  = (g: number, deg: number, b: number) => g * Math.sin(deg * Math.PI/180) / (1+b);
const calcVBot   = (g: number, h: number,   b: number) => Math.sqrt(2*g*h/(1+b));
const calcTTotal = (a: number, h: number,   deg: number) => {
  const L = h / Math.sin(deg * Math.PI/180);
  return Math.sqrt(2*L/a);
};

// â”€â”€â”€ PHOTOREALISTIC SPHERE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function drawSphere(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  primary: string, highlight: string, shadow: string, spin: number, hollow: boolean) {

  ctx.save();

  // Soft cast shadow on ground plane
  const ds = ctx.createRadialGradient(cx+r*0.2, cy+r*0.25, 0, cx+r*0.1, cy+r*0.15, r*1.5);
  ds.addColorStop(0, "rgba(0,0,0,0.5)"); ds.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ds;
  ctx.beginPath(); ctx.ellipse(cx+r*0.08, cy+r*0.2, r*1.3, r*0.5, 0, 0, Math.PI*2); ctx.fill();

  // --- 3D sphere body ---
  // Layer 1: base sphere with deep shadow on bottom-right
  const base = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.05, cx+r*0.15, cy+r*0.15, r*1.05);
  base.addColorStop(0.0,  highlight);
  base.addColorStop(0.2,  primary);
  base.addColorStop(0.65, shadow);
  base.addColorStop(1.0,  "#000000");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = base; ctx.fill();

  // Layer 2: clip for interior details
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();

  if (hollow) {
    // Hollow: darker centre suggesting empty interior
    const hollow_g = ctx.createRadialGradient(cx, cy, r*0.3, cx, cy, r);
    hollow_g.addColorStop(0, "rgba(0,0,0,0.55)");
    hollow_g.addColorStop(0.6, "rgba(0,0,0,0)");
    ctx.fillStyle = hollow_g; ctx.fillRect(cx-r, cy-r, r*2, r*2);
    // Equatorial latitude rings suggesting shell
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1.2;
    for (let k = -1; k <= 1; k++) {
      const yr = k * r * 0.5;
      const xr = Math.sqrt(Math.max(0, r*r - yr*yr));
      ctx.beginPath(); ctx.ellipse(cx, cy+yr, xr, xr*0.22, 0, 0, Math.PI*2); ctx.stroke();
    }
  } else {
    // Solid: spinning radial lines on surface
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(spin);
    ctx.strokeStyle = "rgba(255,255,255,0.13)"; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const a = (i/8)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*r*0.25, Math.sin(a)*r*0.25);
      ctx.lineTo(Math.cos(a)*r*0.92, Math.sin(a)*r*0.92); ctx.stroke();
    }
    // Equator ring
    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.95, r*0.28, 0, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  // Layer 3: bright specular highlight top-left
  const spec = ctx.createRadialGradient(cx-r*0.42, cy-r*0.42, 0, cx-r*0.18, cy-r*0.18, r*0.6);
  spec.addColorStop(0,   "rgba(255,255,255,0.92)");
  spec.addColorStop(0.35,"rgba(255,255,255,0.35)");
  spec.addColorStop(0.8, "rgba(255,255,255,0.06)");
  spec.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.fillStyle = spec; ctx.fillRect(cx-r, cy-r, r*2, r*2);

  // Layer 4: rim light from lower-right
  const rim = ctx.createRadialGradient(cx+r*0.55, cy+r*0.55, r*0.6, cx+r*0.5, cy+r*0.5, r*1.15);
  rim.addColorStop(0,   "rgba(255,255,255,0.22)");
  rim.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.fillStyle = rim; ctx.fillRect(cx-r, cy-r, r*2, r*2);

  ctx.restore();

  // Thin outline
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1; ctx.stroke();
}

// â”€â”€â”€ PHOTOREALISTIC CYLINDER (seen from side) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function drawCylinder(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  primary: string, highlight: string, shadow: string, spin: number, hollow: boolean) {

  const halfW = r * 1.0;
  const halfH = r * 0.9;
  const ellipseRY = halfW * 0.26; // perspective ellipse vertical radius

  ctx.save();

  // Drop shadow
  const ds = ctx.createRadialGradient(cx+5, cy+halfH+10, 0, cx+4, cy+halfH+6, r*1.8);
  ds.addColorStop(0, "rgba(0,0,0,0.45)"); ds.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ds;
  ctx.fillRect(cx-r*1.6, cy-halfH-4, r*3.5, halfH*2+28);

  // â”€â”€ Bottom ellipse (shadow face) â”€â”€
  ctx.beginPath(); ctx.ellipse(cx, cy+halfH, halfW, ellipseRY, 0, 0, Math.PI*2);
  ctx.fillStyle = shadow; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1; ctx.stroke();

  // â”€â”€ Curved body â”€â”€
  const bodyGrad = ctx.createLinearGradient(cx-halfW, cy, cx+halfW, cy);
  bodyGrad.addColorStop(0.0,  shadow);
  bodyGrad.addColorStop(0.2,  primary);
  bodyGrad.addColorStop(0.48, highlight);
  bodyGrad.addColorStop(0.72, primary);
  bodyGrad.addColorStop(1.0,  shadow);
  ctx.beginPath();
  ctx.moveTo(cx-halfW, cy-halfH+ellipseRY*0.5);
  ctx.lineTo(cx-halfW, cy+halfH-ellipseRY*0.5);
  ctx.ellipse(cx, cy+halfH, halfW, ellipseRY, 0, Math.PI, 0, true);
  ctx.lineTo(cx+halfW, cy-halfH+ellipseRY*0.5);
  ctx.ellipse(cx, cy-halfH, halfW, ellipseRY, 0, 0, Math.PI);
  ctx.fillStyle = bodyGrad; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1; ctx.stroke();

  // Clip body for interior
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx-halfW, cy-halfH+ellipseRY*0.5);
  ctx.lineTo(cx-halfW, cy+halfH-ellipseRY*0.5);
  ctx.ellipse(cx, cy+halfH, halfW, ellipseRY, 0, Math.PI, 0, true);
  ctx.lineTo(cx+halfW, cy-halfH+ellipseRY*0.5);
  ctx.ellipse(cx, cy-halfH, halfW, ellipseRY, 0, 0, Math.PI);
  ctx.clip();

  // Specular streak
  const streak = ctx.createLinearGradient(cx-halfW*0.85, cy-halfH, cx-halfW*0.1, cy+halfH);
  streak.addColorStop(0,   "rgba(255,255,255,0.55)");
  streak.addColorStop(0.4, "rgba(255,255,255,0.18)");
  streak.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.fillStyle = streak;
  ctx.fillRect(cx-halfW, cy-halfH-5, halfW*0.65, halfH*2+10);

  // Spin lines on body
  ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
  if (!hollow) {
    for (let i = 0; i < 5; i++) {
      const f = (i/4);
      const lx = cx-halfW + f*halfW*2;
      ctx.beginPath(); ctx.moveTo(lx, cy-halfH); ctx.lineTo(lx, cy+halfH); ctx.stroke();
    }
  } else {
    // Wall edges for hollow
    for (const sx of [-1, 1]) {
      ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx + sx*(halfW-3), cy-halfH); ctx.lineTo(cx + sx*(halfW-3), cy+halfH); ctx.stroke();
    }
  }
  ctx.restore();

  // â”€â”€ Top ellipse (lit face) â”€â”€
  ctx.save();
  if (hollow) {
    // Hollow opening â€” dark interior
    ctx.beginPath(); ctx.ellipse(cx, cy-halfH, halfW, ellipseRY, 0, 0, Math.PI*2);
    ctx.fillStyle = "#050d1a"; ctx.fill();
    ctx.strokeStyle = highlight+"99"; ctx.lineWidth = 2; ctx.stroke();
    // Inner ring showing wall thickness
    ctx.beginPath(); ctx.ellipse(cx, cy-halfH, halfW*0.78, ellipseRY*0.78, 0, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1; ctx.stroke();
  } else {
    const topG = ctx.createRadialGradient(cx-halfW*0.3, cy-halfH-ellipseRY*0.5, 1, cx, cy-halfH, halfW*1.1);
    topG.addColorStop(0, highlight);
    topG.addColorStop(0.5, primary+"cc");
    topG.addColorStop(1, shadow+"88");
    ctx.beginPath(); ctx.ellipse(cx, cy-halfH, halfW, ellipseRY, 0, 0, Math.PI*2);
    ctx.fillStyle = topG; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1.5; ctx.stroke();
    // Spin radial lines on top face
    ctx.save(); ctx.translate(cx, cy-halfH); ctx.rotate(spin);
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i/6)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*halfW*0.9, Math.sin(a)*ellipseRY*0.9); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, halfW*0.12, 0, Math.PI*2);
    ctx.fillStyle = "white"; ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  ctx.restore();
}

// â”€â”€â”€ PHOTOREALISTIC CHROME BALL (Point Mass) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function drawChromeBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, spin: number) {
  ctx.save();

  const ds = ctx.createRadialGradient(cx+4, cy+6, 0, cx+3, cy+4, r*1.5);
  ds.addColorStop(0, "rgba(0,0,0,0.55)"); ds.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ds;
  ctx.beginPath(); ctx.ellipse(cx+3, cy+r*0.85, r*1.2, r*0.4, 0, 0, Math.PI*2); ctx.fill();

  // Chrome gradient (gold tones)
  const chrome = ctx.createRadialGradient(cx-r*0.38, cy-r*0.38, r*0.04, cx, cy, r);
  chrome.addColorStop(0.00, "#ffffff");
  chrome.addColorStop(0.08, "#ffe082");
  chrome.addColorStop(0.25, "#f9a825");
  chrome.addColorStop(0.5,  "#e65100");
  chrome.addColorStop(0.75, "#6d2600");
  chrome.addColorStop(1.00, "#1a0800");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = chrome; ctx.fill();

  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();

  // Spin notches
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(spin);
  ctx.strokeStyle = "rgba(200,120,0,0.35)"; ctx.lineWidth = 1.2;
  for (let i = 0; i < 10; i++) {
    const a = (i/10)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(Math.cos(a)*r*0.5, Math.sin(a)*r*0.5);
    ctx.lineTo(Math.cos(a)*r*0.88, Math.sin(a)*r*0.88); ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(0,0, r*0.92, r*0.28, 0, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(255,180,30,0.2)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  // Specular
  const spec = ctx.createRadialGradient(cx-r*0.44, cy-r*0.44, 0, cx-r*0.22, cy-r*0.22, r*0.52);
  spec.addColorStop(0,    "rgba(255,255,255,0.95)");
  spec.addColorStop(0.4,  "rgba(255,255,255,0.4)");
  spec.addColorStop(1,    "rgba(255,255,255,0)");
  ctx.fillStyle = spec; ctx.fillRect(cx-r, cy-r, r*2, r*2);

  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(255,180,30,0.3)"; ctx.lineWidth = 1.2; ctx.stroke();
}

// â”€â”€â”€ COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function RollingMotionSimulator() {
  const [mass,        setMass]        = useState(2.0);
  const [radius,      setRadius]      = useState(0.15);
  const [angle,       setAngle]       = useState(30);
  const [height,      setHeight]      = useState(3.0);
  const [gravity,     setGravity]     = useState(9.81);
  const [selectedObj, setSelectedObj] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [running,     setRunning]     = useState(false);
  const [raceStarted, setRaceStarted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRef   = useRef(0);
  const timeRef   = useRef(0);
  const posRef    = useRef(OBJECTS.map(() => 0));
  const velRef    = useRef(OBJECTS.map(() => 0));
  const spinRef   = useRef(OBJECTS.map(() => 0));
  const finRef    = useRef(OBJECTS.map(() => false));
  const trailRef  = useRef<{x:number,y:number}[][]>(OBJECTS.map(() => []));

  const obj      = OBJECTS[selectedObj];
  const accel    = calcAccel(gravity, angle, obj.beta);
  const vBottom  = calcVBot(gravity, height, obj.beta);
  const slopeLen = height / Math.sin(angle * Math.PI/180);
  const tTotal   = calcTTotal(accel, height, angle);
  const PE       = mass * gravity * height;
  const KEt      = 0.5 * mass * vBottom * vBottom;
  const KEr      = 0.5 * obj.beta * mass * vBottom * vBottom;

  const resetSim = useCallback(() => {
    posRef.current  = OBJECTS.map(() => 0);
    velRef.current  = OBJECTS.map(() => 0);
    spinRef.current = OBJECTS.map(() => 0);
    finRef.current  = OBJECTS.map(() => false);
    trailRef.current= OBJECTS.map(() => []);
    timeRef.current = 0;
    setRunning(false); setRaceStarted(false);
  }, []);

  const handleReset = () => {
    setMass(2); setRadius(0.15); setAngle(30); setHeight(3);
    setGravity(9.81); setSelectedObj(0); setCompareMode(false); resetSim();
  };

  const startRace = () => { resetSim(); setTimeout(() => { setRunning(true); setRaceStarted(true); }, 80); };

  // â”€â”€ Draw â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    // BG
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#090f1d"); bg.addColorStop(1, "#050b15");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(148,163,184,0.05)"; ctx.lineWidth = 1;
    for (let x=0; x<W; x+=45){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0; y<H; y+=45){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    const theta    = angle * Math.PI/180;
    const visualR  = Math.max(20, Math.min(32, radius * 100));
    const rawLen   = slopeLen * 90;
    const maxPx    = Math.min(W * 0.76, H * 0.78);
    const sc       = Math.min(1, maxPx / rawLen);
    const slopePx  = rawLen * sc;
    const bX = W * 0.1, bY = H - 72;
    const tX = bX + Math.cos(theta)*slopePx, tY = bY - Math.sin(theta)*slopePx;

    // Ground
    const gGrad = ctx.createLinearGradient(0, bY, 0, bY+12);
    gGrad.addColorStop(0, "#1e3a5f"); gGrad.addColorStop(1, "#0a1628");
    ctx.fillStyle = gGrad; ctx.fillRect(0, bY, W, 12);
    ctx.strokeStyle = "#2563eb44"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, bY); ctx.lineTo(W, bY); ctx.stroke();

    // Incline fill
    ctx.beginPath(); ctx.moveTo(tX, tY); ctx.lineTo(bX, bY); ctx.lineTo(tX, bY); ctx.closePath();
    const triG = ctx.createLinearGradient(tX, tY, bX, bY);
    triG.addColorStop(0, "#182840"); triG.addColorStop(1, "#0d1e30");
    ctx.fillStyle = triG; ctx.fill();

    // Slope surface with grip notches
    ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 4;
    const slopeGrad = ctx.createLinearGradient(tX, tY, bX, bY);
    slopeGrad.addColorStop(0, "#60a5fa"); slopeGrad.addColorStop(0.5, "#3b82f6"); slopeGrad.addColorStop(1, "#1d4ed8");
    ctx.strokeStyle = slopeGrad; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(tX, tY); ctx.lineTo(bX, bY); ctx.stroke();
    ctx.strokeStyle = "rgba(100,160,255,0.18)"; ctx.lineWidth = 1;
    const nc = Math.floor(slopePx/30);
    for (let i=1; i<nc; i++) {
      const f=i/nc, nx=lerp(tX,bX,f), ny=lerp(tY,bY,f);
      const px=Math.cos(theta+Math.PI/2)*7, py=Math.sin(theta+Math.PI/2)*7;
      ctx.beginPath(); ctx.moveTo(nx-px,ny-py); ctx.lineTo(nx+px,ny+py); ctx.stroke();
    }

    // Height marker
    ctx.setLineDash([5,5]); ctx.strokeStyle = "#f59e0b88"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(tX,tY); ctx.lineTo(tX,bY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font="bold 12px 'Courier New'"; ctx.fillStyle="#f59e0b"; ctx.textAlign="center";
    ctx.fillText(`h=${height.toFixed(1)}m`, tX+24, (tY+bY)/2);

    // Angle arc
    ctx.strokeStyle="#f59e0baa"; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(bX, bY, 38, -theta, 0); ctx.stroke();
    ctx.fillStyle="#f59e0b"; ctx.font="12px 'Courier New'"; ctx.textAlign="left";
    ctx.fillText(`${angle}Â°`, bX+42, bY-14);

    // â”€â”€ Render objects â”€â”€
    const objList = compareMode ? OBJECTS : [obj];
    objList.forEach((o, ii) => {
      const i   = compareMode ? ii : selectedObj;
      const pos = posRef.current[i];
      const slX = lerp(tX, bX, pos), slY = lerp(tY, bY, pos);
      const cx  = slX + Math.sin(theta)*visualR;
      const cy  = slY - Math.cos(theta)*visualR;

      // Trail
      const trail = trailRef.current[i];
      trail.push({ x:cx, y:cy });
      if (trail.length > 60) trail.shift();
      for (let j=1; j<trail.length; j++) {
        const f=j/trail.length;
        ctx.strokeStyle = o.primary + Math.floor(f*155).toString(16).padStart(2,"0");
        ctx.lineWidth = visualR*0.5*f;
        ctx.beginPath(); ctx.moveTo(trail[j-1].x,trail[j-1].y); ctx.lineTo(trail[j].x,trail[j].y); ctx.stroke();
      }

      // Outer glow
      const halo = ctx.createRadialGradient(cx,cy,visualR*0.65,cx,cy,visualR*2.4);
      halo.addColorStop(0, o.primary+"44"); halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(cx,cy,visualR*2.4,0,Math.PI*2); ctx.fill();

      // Draw the object
      const spin = spinRef.current[i];
      const isSph  = o.id==="solid-sphere"    || o.id==="hollow-sphere";
      const isCyl  = o.id==="solid-cylinder"  || o.id==="hollow-cylinder";
      const hollow = o.id==="hollow-sphere"   || o.id==="hollow-cylinder";

      if (o.id === "point-mass") {
        drawChromeBall(ctx, cx, cy, visualR, spin);
      } else if (isSph) {
        drawSphere(ctx, cx, cy, visualR, o.primary, o.highlight, o.shadow, spin, hollow);
      } else if (isCyl) {
        drawCylinder(ctx, cx, cy, visualR, o.primary, o.highlight, o.shadow, spin, hollow);
      }

      // Velocity arrow
      const spd = velRef.current[i];
      if (spd > 0.2 && pos < 0.99) {
        const aLen = Math.min(50, spd*4.5);
        const dirX = -Math.cos(theta)*aLen, dirY = Math.sin(theta)*aLen;
        const mag  = Math.sqrt(dirX*dirX+dirY*dirY)||1;
        const ex = cx+dirX, ey = cy+dirY;
        ctx.strokeStyle="#34d399"; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ex,ey); ctx.stroke();
        const aa=Math.atan2(dirY/mag,dirX/mag);
        ctx.fillStyle="#34d399"; ctx.beginPath();
        ctx.moveTo(ex,ey); ctx.lineTo(ex-Math.cos(aa-0.42)*9,ey-Math.sin(aa-0.42)*9);
        ctx.lineTo(ex-Math.cos(aa+0.42)*9,ey-Math.sin(aa+0.42)*9); ctx.fill();
      }

      // Contact point
      if (pos < 0.99) {
        ctx.beginPath(); ctx.arc(slX,slY,4,0,Math.PI*2);
        ctx.fillStyle="#ef4444"; ctx.fill();
        ctx.strokeStyle="#fff"; ctx.lineWidth=1.2; ctx.stroke();
      }

      // Compare labels
      if (compareMode) {
        ctx.font="bold 11px 'Courier New'"; ctx.fillStyle=o.highlight; ctx.textAlign="center";
        ctx.fillText(o.name, cx, cy-visualR-9);
        ctx.fillStyle="#64748b"; ctx.font="9px 'Courier New'";
        ctx.fillText(`${(pos*100).toFixed(0)}%`, cx, cy-visualR-20);
        if (finRef.current[i]) { ctx.fillStyle="#10b981"; ctx.fillText("âœ“ DONE", cx, cy-visualR-31); }
      }
    });

    // Energy bars (single mode)
    if (!compareMode) {
      const pos  = posRef.current[selectedObj];
      const curH = height*(1-pos);
      const cPE  = mass*gravity*curH;
      const cKE  = Math.max(0,PE-cPE);
      const cKEt = cKE/(1+obj.beta);
      const cKEr = cKE-cKEt;
      const mx   = PE||1;
      const bx=W-148, by=30, bw=22, bh=H*0.42;
      [
        {label:"PE",   val:cPE,  c0:"#f59e0b",c1:"#fde68a", x:bx },
        {label:"KE_t", val:cKEt, c0:"#2563eb",c1:"#93c5fd", x:bx+bw+10 },
        {label:"KE_r", val:cKEr, c0:"#7c3aed",c1:"#c4b5fd", x:bx+(bw+10)*2 },
      ].forEach(bar => {
        ctx.fillStyle="#0a121e"; ctx.beginPath(); ctx.roundRect(bar.x,by,bw,bh,4); ctx.fill();
        ctx.strokeStyle="#1e3a5f"; ctx.lineWidth=1; ctx.stroke();
        const fH=(bar.val/mx)*bh;
        const fg=ctx.createLinearGradient(0,by+bh-fH,0,by+bh);
        fg.addColorStop(0,bar.c1); fg.addColorStop(1,bar.c0);
        ctx.fillStyle=fg; ctx.beginPath(); ctx.roundRect(bar.x,by+bh-fH,bw,fH,4); ctx.fill();
        ctx.font="9px 'Courier New'"; ctx.fillStyle=bar.c1; ctx.textAlign="center";
        ctx.fillText(bar.label, bar.x+bw/2, by+bh+13);
        ctx.fillText(`${bar.val.toFixed(1)}J`, bar.x+bw/2, by+bh+23);
      });
      ctx.font="10px 'Courier New'"; ctx.fillStyle="#475569"; ctx.textAlign="right";
      ctx.fillText("ENERGY", W-10, by-10);
    }

    // Time
    ctx.font="bold 14px 'Courier New'"; ctx.fillStyle="#94a3b8"; ctx.textAlign="left";
    ctx.fillText(`t = ${timeRef.current.toFixed(2)}s`, 14, 24);

  }, [angle, height, mass, radius, gravity, obj, selectedObj, compareMode, slopeLen, PE]);

  // â”€â”€ Anim loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    let id: number;
    const animate = (now: number) => {
      const dt = Math.min((now-lastRef.current)/1000, 0.04);
      lastRef.current = now;
      if (running) {
        timeRef.current += dt;
        const list = compareMode ? OBJECTS : [obj];
        list.forEach((o, ii) => {
          const i = compareMode ? ii : selectedObj;
          if (finRef.current[i]) return;
          const a   = calcAccel(gravity, angle, o.beta);
          const vM  = calcVBot(gravity, height, o.beta);
          velRef.current[i] = Math.min(velRef.current[i]+a*dt, vM);
          posRef.current[i] = Math.min(1, posRef.current[i]+(velRef.current[i]*dt)/slopeLen);
          spinRef.current[i]+= (velRef.current[i]/Math.max(0.05,radius))*dt;
          if (posRef.current[i]>=1) { posRef.current[i]=1; finRef.current[i]=true; }
        });
        const done = compareMode ? OBJECTS.every((_,i)=>finRef.current[i]) : finRef.current[selectedObj];
        if (done) setRunning(false);
      }
      draw();
      id = requestAnimationFrame(animate);
    };
    lastRef.current = performance.now();
    id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [running, compareMode, obj, selectedObj, angle, gravity, height, radius, slopeLen, draw]);

  useEffect(() => { trailRef.current = OBJECTS.map(()=>[]); }, [angle, height, radius]);

  const pos   = posRef.current[selectedObj];
  const curH  = height*(1-pos);
  const curPE = mass*gravity*curH;
  const curKE = Math.max(0, PE-curPE);
  const curKEt= curKE/(1+obj.beta);
  const curKEr= curKE-curKEt;
  const curV  = velRef.current[selectedObj];
  const omega = radius>0 ? curV/radius : 0;

  const cs: React.CSSProperties = { fontFamily:"'Courier New',monospace" };

  return (
    <main className="min-h-screen bg-[#060c18] text-neutral-200" style={cs}>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />
      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="space-y-6">

      {/* HEADER */}
      <div style={{ padding:"10px 22px", borderBottom:"1px solid #1e3a5f", background:"#040810", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:"conic-gradient(#3b82f6,#8b5cf6,#06b6d4,#10b981,#f59e0b,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:"white" }} />
          </div>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:"#3b82f6", letterSpacing:2 }}>ROLLING MOTION</div>
            <div style={{ fontSize:10, color:"#334155" }}>Inclined Plane Â· Energy Partition Â· Race Mode</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>{ setCompareMode(c=>!c); resetSim(); }}
            style={{ padding:"7px 16px", borderRadius:7, border:`1px solid ${compareMode?"#8b5cf6":"#1e3a5f"}`, background:compareMode?"#8b5cf622":"transparent", color:compareMode?"#a78bfa":"#64748b", cursor:"pointer", fontSize:12, fontFamily:"Courier New" }}>
            âš– Race Mode {compareMode?"ON":"OFF"}
          </button>
          <button onClick={startRace}
            style={{ padding:"7px 16px", borderRadius:7, border:"1px solid #3b82f6", background:"#3b82f622", color:"#60a5fa", cursor:"pointer", fontSize:12, fontFamily:"Courier New", fontWeight:800 }}>
            {running ? "\u23F8 Pause" : "\u25B6 Play"}
          </button>
        </div>
      </div>



        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Canvas (2 columns) */}
          <div className="col-span-1 lg:col-span-2 relative border border-neutral-800 rounded-2xl overflow-hidden" style={{ minHeight:410 }}>
          <canvas ref={canvasRef} width={920} height={530} style={{ width:"100%", height:"100%", display:"block" }} />

          {/* Stats overlay */}
          <div style={{ position:"absolute", top:12, left:12, background:"rgba(4,8,16,0.94)", border:"1px solid #1e3a5f", borderRadius:10, padding:"10px 16px", fontSize:12, minWidth:162 }}>
            <div style={{ color:"#334155", fontSize:10, marginBottom:5, letterSpacing:1 }}>âš¡ LIVE STATS</div>
            {([["PE",`${curPE.toFixed(2)} J`,"#f59e0b"],["KE_trans",`${curKEt.toFixed(2)} J`,"#3b82f6"],["KE_rot",`${curKEr.toFixed(2)} J`,"#8b5cf6"],["v",`${curV.toFixed(2)} m/s`,"#10b981"],["Ï‰",`${omega.toFixed(2)} rad/s`,"#06b6d4"]] as const).map(([l,v,c])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:2 }}>
                <span style={{ color:"#475569" }}>{l}</span>
                <span style={{ color:c, fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Formula badge */}
          <div style={{ position:"absolute", top:12, right:compareMode?12:155, background:"rgba(4,8,16,0.94)", border:`1px solid ${obj.primary}55`, borderRadius:10, padding:"10px 16px" }}>
            <div style={{ color:"#334155", fontSize:10, marginBottom:3, letterSpacing:1 }}>ðŸ“ SELECTED</div>
            <div style={{ color:obj.highlight, fontWeight:800, fontSize:14 }}>{obj.name}</div>
            <div style={{ color:obj.primary, fontSize:12 }}>{obj.formula}</div>
            <div style={{ color:"#475569", fontSize:11, marginTop:4 }}>a = gÂ·sinÎ¸/(1+Î²)</div>
            <div style={{ color:"#34d399", fontSize:12, fontWeight:700 }}>= {accel.toFixed(3)} m/sÂ²</div>
          </div>
        </div>

          {/* Controls (1 column) */}
          <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700" style={{ padding:"14px 18px", background:"#040810" }}>
          <div style={{ fontSize:11, color:"#334155", marginBottom:10, letterSpacing:2 }}>âš™ PARAMETERS</div>

          {/* Shape selector */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:7 }}>Rolling Object</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {OBJECTS.map((o, i) => (
                <button key={o.id} onClick={()=>{ setSelectedObj(i); resetSim(); }}
                  style={{ padding:"7px 8px", borderRadius:8, fontSize:10, cursor:"pointer", textAlign:"left",
                    border:`1.5px solid ${selectedObj===i?o.primary:"#1e3a5f"}`,
                    background:selectedObj===i?o.primary+"22":"#080f1c",
                    color:selectedObj===i?o.highlight:"#475569", transition:"all 0.18s" }}>
                  <div style={{ fontWeight:700, fontSize:11 }}>{o.name}</div>
                  <div style={{ fontSize:9, opacity:0.7, marginTop:1 }}>{o.formula} Â· {o.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          {[
            {label:"Mass (M)",       value:mass,    set:setMass,    min:0.1,  max:10,  step:0.1,  unit:"kg",   color:"#3b82f6", icon:"âš–"},
            {label:"Radius (R)",     value:radius,  set:setRadius,  min:0.05, max:0.5, step:0.01, unit:"m",    color:"#8b5cf6", icon:"ðŸ“"},
            {label:"Angle Î¸",        value:angle,   set:setAngle,   min:5,    max:60,  step:1,    unit:"Â°",    color:"#f59e0b", icon:"ðŸ“"},
            {label:"Height (h)",     value:height,  set:setHeight,  min:0.5,  max:8,   step:0.1,  unit:"m",    color:"#06b6d4", icon:"ðŸ”"},
            {label:"Gravity (g)",    value:gravity, set:setGravity, min:1,    max:25,  step:0.1,  unit:"m/sÂ²", color:"#10b981", icon:"ðŸŒ"},
          ].map(p => (
            <div key={p.label} style={{ marginBottom:13 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontSize:11, color:"#94a3b8" }}>{p.icon} {p.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:p.color }}>
                  {p.value.toFixed(p.step<0.1?2:p.step<1?2:0)}
                  <span style={{ fontSize:10, fontWeight:400, color:"#334155" }}> {p.unit}</span>
                </span>
              </div>
              <input type="range" min={p.min} max={p.max} step={p.step} value={p.value}
                onChange={e=>{ p.set(Number(e.target.value)); resetSim(); }}
                aria-label={`${p.label}: ${p.value} ${p.unit}`}
                style={{ width:"100%", accentColor:p.color, cursor:"pointer", height:6 }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#1e3a5f", marginTop:1 }}>
                <span>{p.min}</span><span>{p.max}</span>
              </div>
            </div>
          ))}

          {/* Accel bars */}
          <div style={{ background:"#080f1c", border:"1px solid #1e3a5f", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:10, color:"#334155", marginBottom:7, letterSpacing:0.5 }}>ACCELERATION RANKING</div>
            {[...OBJECTS].sort((a,b)=>b.beta-a.beta).map(o=>{
              const ai=calcAccel(gravity,angle,o.beta), aM=calcAccel(gravity,angle,0);
              return (
                <div key={o.id} style={{ marginBottom:6 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:2 }}>
                    <span style={{ color:o.highlight }}>{o.name}</span>
                    <span style={{ color:"#64748b" }}>{ai.toFixed(3)} m/sÂ²</span>
                  </div>
                  <div style={{ height:6, background:"#0a121e", borderRadius:4 }}>
                    <div style={{ height:"100%", width:`${(ai/aM)*100}%`, borderRadius:4, transition:"width 0.3s",
                      background:`linear-gradient(90deg,${o.primary},${o.highlight})` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div style={{ background:"#06080f", border:"1px solid #1e3a5f", borderRadius:8, padding:"10px 12px", marginBottom:12, fontSize:11 }}>
            <div style={{ color:"#f59e0b", fontWeight:700, marginBottom:5 }}>ðŸ’¡ Try This!</div>
            <div style={{ color:"#64748b", lineHeight:1.9 }}>
              ðŸ† <strong style={{ color:"#60a5fa" }}>Race all 5:</strong> Race Mode â†’ Start<br/>
              ðŸŒ™ <strong style={{ color:"#a78bfa" }}>Moon g=1.62:</strong> Same winner, slow race<br/>
              âš¡ <strong style={{ color:"#34d399" }}>Max speed:</strong> Î¸=60Â°, h=8m, g=25<br/>
              ðŸŽ¯ <strong style={{ color:"#fcd34d" }}>Mass check:</strong> Change M â€” same winner!
            </div>
          </div>

          <button onClick={handleReset}
            style={{ width:"100%", padding:"11px", borderRadius:8, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", cursor:"pointer", fontWeight:800, fontSize:13, letterSpacing:1, fontFamily:"Courier New" }}
            onMouseEnter={e=>e.currentTarget.style.background="linear-gradient(135deg,#1e3a8a,#1d4ed8)"}
            onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(135deg,#1d4ed8,#3b82f6)"}>
            {"\u21BA Reset"}</button>
        </aside>
      </div>

        {/* BOTTOM PANEL */}
      <div style={{ borderTop:"1px solid #1e3a5f", background:"#040810", padding:"16px 26px", display:"flex", gap:22, minHeight:215 }}>
        <div style={{ flex:"0 0 36%" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#3b82f6", marginBottom:10, borderBottom:"1px solid #1e3a5f", paddingBottom:6 }}>âœ¨ The Concept</div>
          <p style={{ fontSize:12, color:"#94a3b8", lineHeight:1.8, marginBottom:10 }}>
            When a rigid body <strong style={{ color:"#e2e8f0" }}>rolls without slipping</strong>, potential energy splits into <em style={{ color:"#60a5fa" }}>translational KE</em> (Â½mvÂ²) and <em style={{ color:"#a78bfa" }}>rotational KE</em> (Â½IÏ‰Â²). Objects with mass at the rim store more energy in spin â€” leaving less for forward motion. Shape (Î²) alone determines the winner â€” mass and radius cancel out entirely.
          </p>
          <div style={{ background:"#080f1c", borderRadius:8, padding:"10px 14px", border:"1px solid #1e3a5f" }}>
            <div style={{ fontSize:10, color:"#334155", marginBottom:7 }}>ðŸ“ KEY FORMULAE</div>
            {[["Acceleration","a = gÂ·sinÎ¸ / (1+Î²)","#3b82f6"],["Speed at bottom","v = âˆš(2gh / (1+Î²))","#8b5cf6"],["No-slip","v = Ï‰ Â· R","#06b6d4"],["KE ratio","KE_r / KE_t = Î²","#10b981"],["Winner","smallest Î² wins!","#f59e0b"]].map(([l,f,c])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                <span style={{ color:"#475569" }}>{l}</span>
                <span style={{ color:c, fontWeight:700 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex:"0 0 32%", borderLeft:"1px solid #1e3a5f", paddingLeft:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#8b5cf6", marginBottom:10, borderBottom:"1px solid #1e3a5f", paddingBottom:6 }}>ðŸ“Š Live Calculation</div>
          <div style={{ background:"#080f1c", borderRadius:8, padding:"12px 14px", border:"1px solid #1e3a5f", fontSize:12, lineHeight:2.1 }}>
            <div style={{ color:"#334155", fontSize:10 }}>Acceleration:</div>
            <div style={{ color:"#f59e0b" }}>a = gÂ·sinÎ¸ / (1+Î²)</div>
            <div style={{ color:"#e2e8f0" }}>= <span style={{ color:"#fcd34d" }}>{gravity.toFixed(2)}</span>Â·sin<span style={{ color:"#f59e0b" }}>{angle}Â°</span>/(1+<span style={{ color:obj.highlight }}>{obj.beta.toFixed(3)}</span>)</div>
            <div style={{ color:"#34d399", fontWeight:700 }}>= {accel.toFixed(4)} m/sÂ²</div>
            <div style={{ height:1, background:"#1e3a5f", margin:"5px 0" }} />
            <div style={{ color:"#334155", fontSize:10 }}>Speed at bottom:</div>
            <div style={{ color:"#60a5fa" }}>v = âˆš(2Â·{gravity.toFixed(1)}Â·{height.toFixed(1)}/(1+{obj.beta.toFixed(3)}))</div>
            <div style={{ color:"#34d399", fontWeight:700 }}>= {vBottom.toFixed(4)} m/s</div>
          </div>
          <div style={{ marginTop:10, background:"#080f1c", borderRadius:8, padding:"10px 14px", border:"1px solid #1e3a5f", fontSize:11 }}>
            <div style={{ color:"#334155", fontSize:10, marginBottom:5 }}>âš¡ ENERGY AT BOTTOM</div>
            <div style={{ color:"#f59e0b" }}>Total (PE): <strong>{PE.toFixed(3)} J</strong></div>
            <div style={{ color:"#60a5fa" }}>KE_trans: <strong>{KEt.toFixed(3)} J ({(KEt/PE*100).toFixed(1)}%)</strong></div>
            <div style={{ color:"#a78bfa" }}>KE_rot: <strong>{KEr.toFixed(3)} J ({(KEr/PE*100).toFixed(1)}%)</strong></div>
            <div style={{ color:"#94a3b8" }}>Time to bottom: <strong style={{ color:"#67e8f9" }}>{tTotal.toFixed(3)} s</strong></div>
          </div>
        </div>
        <div style={{ flex:1, borderLeft:"1px solid #1e3a5f", paddingLeft:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#06b6d4", marginBottom:10, borderBottom:"1px solid #1e3a5f", paddingBottom:6 }}>ðŸ’¡ Try This for Drama!</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {[
              {icon:"ðŸŽ",title:"The Classic Race",   desc:"Race Mode ON Â· Î¸=30Â°, h=3m â€” all 5 objects", result:"Solid Sphere wins, Hollow Cylinder loses. Always.", color:"#3b82f6"},
              {icon:"ðŸŒ™",title:"Moon Race",          desc:"Set gravity = 1.62 m/sÂ² (lunar surface)",     result:"Same finishing order but everything 2.5Ã— slower!", color:"#8b5cf6"},
              {icon:"ðŸš€",title:"Extreme Slope",      desc:"Î¸=60Â°, h=8m, g=9.81 â€” Point Mass Î²=0",       result:"Pure slide! No rotational loss â€” hits 11.1 m/s!", color:"#f59e0b"},
              {icon:"ðŸŽ¯",title:"Mass Independence",  desc:"Change mass 0.1â†’10 kg while watching race",   result:"Winner unchanged â€” Î² alone decides the outcome!", color:"#10b981"},
            ].map(tip=>(
              <div key={tip.title} style={{ background:"#080f1c", border:`1px solid ${tip.color}44`, borderRadius:8, padding:"8px 13px" }}>
                <div style={{ fontWeight:700, color:tip.color, fontSize:12, marginBottom:2 }}>{tip.icon} {tip.title}</div>
                <div style={{ fontSize:11, color:"#334155", marginBottom:2 }}>{tip.desc}</div>
                <div style={{ fontSize:11, color:"#94a3b8", fontStyle:"italic" }}>â†’ {tip.result}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* THEORY */}
      <div style={{ borderTop:"2px solid #1e3a5f", background:"#030609", padding:"18px 28px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#3b82f6", marginBottom:14, letterSpacing:1.5 }}>ðŸ“š PHYSICS THEORY â€” ROLLING MOTION</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:22, fontSize:12, color:"#64748b", lineHeight:1.85 }}>
          <div>
            <div style={{ color:"#60a5fa", fontWeight:700, marginBottom:6 }}>Rolling Without Slipping</div>
            Rolling without slipping requires the contact point velocity to be zero. This geometric constraint gives v = Ï‰R. Static friction at the contact point generates the torque to spin the object â€” crucially, it does zero work since the contact point doesn't move. Total mechanical energy is therefore perfectly conserved throughout the descent.
          </div>
          <div>
            <div style={{ color:"#a78bfa", fontWeight:700, marginBottom:6 }}>The Î² Factor Explained</div>
            The rotational inertia coefficient Î² in I = Î²MRÂ² determines the energy split. Translational KE = mgh/(1+Î²) and rotational KE = Î²Â·mgh/(1+Î²). A hollow cylinder (Î²=1) uses 50% of energy spinning; a solid sphere (Î²=2/5) only 28.6%. This is why shape â€” not mass or radius â€” decides every race. The result is universal and mass-independent.
          </div>
          <div>
            <div style={{ color:"#67e8f9", fontWeight:700, marginBottom:6 }}>Real-World Applications</div>
            Flywheels exploit high Î² (hollow cylinders) to maximise rotational energy storage. Figure skaters pull arms in to reduce I and spin faster (conserving IÏ‰). Car tyres, gyroscopes, yo-yos, and planetary rotation all follow rolling mechanics. The classic inclined-plane race powerfully demonstrates that mass distribution â€” not mass itself â€” governs rotational dynamics.
          </div>
        </div>
      </div>

      <div style={{ borderTop:"1px solid #1e3a5f", padding:"7px 22px", background:"#020406", fontSize:10, color:"#1e3a5f", display:"flex", justifyContent:"space-between" }}>
        <span>Rolling Motion Simulator Â· v = Ï‰R Â· Î² = I/MRÂ²</span>
        <span>PE â†’ KE_trans + KE_rot Â· SI Units</span>
      </div>
      </div>
      </div>
      </section>
    </main>
  );
}



