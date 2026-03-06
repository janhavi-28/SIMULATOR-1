"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

// ─── Physics helpers ──────────────────────────────────────────────────────────
const calcTorque    = (F: number, r: number, theta: number) => F * r * Math.sin(theta * Math.PI / 180);
const calcAlpha     = (tau: number, I: number) => tau / Math.max(0.001, I);
const calcI_rod     = (m: number, L: number) => (1/12) * m * L * L;   // about centre
const calcI_point   = (m: number, r: number) => m * r * r;
const calcKE        = (I: number, omega: number) => 0.5 * I * omega * omega;
const calcAngMom    = (I: number, omega: number) => I * omega;

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number,
  color: string, width: number, headSize: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - 0.42) * headSize, y2 - Math.sin(angle - 0.42) * headSize);
  ctx.lineTo(x2 - Math.cos(angle + 0.42) * headSize, y2 - Math.sin(angle + 0.42) * headSize);
  ctx.fill();
}

function drawArcArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  startA: number, endA: number, color: string, cw: boolean) {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(cx, cy, r, startA, endA, !cw); ctx.stroke();
  // Arrowhead at end
  const a = cw ? endA + Math.PI/2 : endA - Math.PI/2;
  const ex = cx + Math.cos(endA)*r, ey = cy + Math.sin(endA)*r;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - Math.cos(a - 0.4)*10, ey - Math.sin(a - 0.4)*10);
  ctx.lineTo(ex - Math.cos(a + 0.4)*10, ey - Math.sin(a + 0.4)*10);
  ctx.fill();
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TorqueSim() {
  // Parameters
  const [force,      setForce]      = useState(20);      // N
  const [playing, setPlaying] = useState(true);
  const [forceAngle, setForceAngle] = useState(90);      // deg from rod
  const [armDist,    setArmDist]    = useState(1.2);     // m from pivot
  const [mass,       setMass]       = useState(3.0);     // kg
  const [rodLength,  setRodLength]  = useState(2.5);     // m
  const [damping,    setDamping]    = useState(0.15);    // rotational drag
  const [mode,       setMode]       = useState<"free"|"locked">("free");

  // Animation state
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const lastRef    = useRef(0);
  const angleRef   = useRef(0);        // rod angle (rad)
  const omegaRef   = useRef(0);        // angular velocity
  const timeRef    = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const prevTauRef = useRef(0);

  // Derived physics
  const tau      = calcTorque(force, armDist, forceAngle);
  const I        = calcI_rod(mass, rodLength);
  const alpha    = calcAlpha(tau, I);
  const omega    = omegaRef.current;
  const KE       = calcKE(I, omega);
  const L        = calcAngMom(I, omega);
  const leverArm = armDist * Math.sin(forceAngle * Math.PI / 180);

  const handleReset = () => {
    setForce(20); setForceAngle(90); setArmDist(1.2); setMass(3);
    setRodLength(2.5); setDamping(0.15); setMode("free");
    angleRef.current = 0; omegaRef.current = 0; timeRef.current = 0;
    particlesRef.current = [];
  };

  // ── Spawn burst particles ──
  const spawnBurst = useCallback((x: number, y: number, color: string, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3.5;
      particlesRef.current.push({
        x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd,
        life: 1, color, size: 2 + Math.random() * 3
      });
    }
  }, []);

  // ── Draw ─────────────────────────────────────────────────────────────────────
  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    const dt = Math.min((now - lastRef.current) / 1000, 0.04);
    lastRef.current = now;
    timeRef.current += dt;

    // Physics step
    const currentTau = calcTorque(force, armDist, forceAngle);
    const currentI   = calcI_rod(mass, rodLength);
    const currentAlpha = calcAlpha(currentTau, currentI);

    if (mode === "free") {
      omegaRef.current += currentAlpha * dt;
      omegaRef.current *= Math.pow(1 - damping, dt * 60);
      angleRef.current  += omegaRef.current * dt;
    }

    // Burst on high torque spike
    if (Math.abs(currentTau) > 20 && Math.abs(currentTau - prevTauRef.current) > 15) {
      const pivX = W/2, pivY = H * 0.48;
      const pixPerM = Math.min(W, H) * 0.18;
      const ex = pivX + Math.cos(angleRef.current) * armDist * pixPerM;
      const ey = pivY + Math.sin(angleRef.current) * armDist * pixPerM;
      spawnBurst(ex, ey, "#f59e0b", 12);
    }
    prevTauRef.current = currentTau;

    // Update particles
    particlesRef.current = particlesRef.current
      .map(p => ({ ...p, x: p.x+p.vx, y: p.y+p.vy, vy: p.vy+0.08, life: p.life-0.025 }))
      .filter(p => p.life > 0);

    // ── Background ──
    const bg = ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,"#08101e"); bg.addColorStop(1,"#0c1625");
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // Grid
    ctx.strokeStyle = "rgba(148,163,184,0.055)"; ctx.lineWidth = 1;
    for (let x=0; x<W; x+=44){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0; y<H; y+=44){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    const pivX = W/2, pivY = H * 0.48;
    const pixPerM = Math.min(W, H) * 0.17;
    const halfRodPx = (rodLength / 2) * pixPerM;

    const rodA = angleRef.current;
    const rx1 = pivX + Math.cos(rodA) * halfRodPx;
    const ry1 = pivY + Math.sin(rodA) * halfRodPx;
    const rx0 = pivX - Math.cos(rodA) * halfRodPx;
    const ry0 = pivY - Math.sin(rodA) * halfRodPx;

    // Force application point
    const forceX = pivX + Math.cos(rodA) * armDist * pixPerM;
    const forceY = pivY + Math.sin(rodA) * armDist * pixPerM;

    // ── Draw rod shadow ──
    ctx.save();
    ctx.shadowColor = "#3b82f688"; ctx.shadowBlur = 18;
    const rodGrad = ctx.createLinearGradient(rx0, ry0, rx1, ry1);
    rodGrad.addColorStop(0, "#1e3a5f");
    rodGrad.addColorStop(0.5, "#60a5fa");
    rodGrad.addColorStop(1, "#1e3a5f");
    ctx.strokeStyle = rodGrad; ctx.lineWidth = 12; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(rx0, ry0); ctx.lineTo(rx1, ry1); ctx.stroke();
    ctx.restore();

    // Shiny highlight on rod
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    const offX = Math.sin(rodA)*3, offY = -Math.cos(rodA)*3;
    ctx.beginPath(); ctx.moveTo(rx0+offX, ry0+offY); ctx.lineTo(rx1+offX, ry1+offY); ctx.stroke();

    // Rod end caps
    for (const [ex,ey] of [[rx0,ry0],[rx1,ry1]]) {
      const cap = ctx.createRadialGradient(ex,ey,0,ex,ey,10);
      cap.addColorStop(0,"#93c5fd"); cap.addColorStop(1,"#1e3a5f");
      ctx.beginPath(); ctx.arc(ex,ey,10,0,Math.PI*2);
      ctx.fillStyle = cap; ctx.fill();
      ctx.strokeStyle="#60a5fa"; ctx.lineWidth=1.5; ctx.stroke();
    }

    // Lever arm dashed line
    ctx.setLineDash([5,5]);
    ctx.strokeStyle = "#f59e0b88"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pivX, pivY); ctx.lineTo(forceX, forceY); ctx.stroke();
    ctx.setLineDash([]);

    // Lever arm distance label
    const midX = (pivX+forceX)/2, midY = (pivY+forceY)/2;
    ctx.font = "bold 12px 'Courier New'"; ctx.fillStyle = "#f59e0b"; ctx.textAlign = "center";
    ctx.fillText(`r = ${armDist.toFixed(1)} m`, midX + Math.sin(rodA)*18, midY - Math.cos(rodA)*18);

    // ── Force vector ──
    const thetaRad = forceAngle * Math.PI / 180;
    // Force direction perpendicular offset by forceAngle from rod
    const forceDir = rodA + thetaRad - Math.PI/2;
    const fScale = Math.min(force * 2.5, 120);
    const fEx = forceX + Math.cos(forceDir) * fScale;
    const fEy = forceY + Math.sin(forceDir) * fScale;

    // Force glow
    const fGlow = ctx.createRadialGradient(forceX,forceY,0,forceX,forceY,35);
    fGlow.addColorStop(0, "#ef444455"); fGlow.addColorStop(1,"transparent");
    ctx.fillStyle=fGlow; ctx.beginPath(); ctx.arc(forceX,forceY,35,0,Math.PI*2); ctx.fill();

    drawArrow(ctx, forceX, forceY, fEx, fEy, "#ef4444", 3, 12);

    // Force label
    ctx.font = "bold 12px 'Courier New'"; ctx.fillStyle = "#ef4444"; ctx.textAlign = "left";
    const flx = fEx + Math.cos(forceDir)*8, fly = fEy + Math.sin(forceDir)*8;
    ctx.fillText(`F=${force.toFixed(0)}N`, flx, fly);

    // ── Lever arm perpendicular line (visual) ──
    // Drop perpendicular from pivot to force line
    const perpLen = Math.abs(leverArm) * pixPerM;
    if (perpLen > 5) {
      const perpDir = forceDir;
      const perpEx = pivX + Math.cos(perpDir) * perpLen * Math.sign(leverArm);
      const perpEy = pivY + Math.sin(perpDir) * perpLen * Math.sign(leverArm);
      ctx.setLineDash([3,4]);
      ctx.strokeStyle = "#10b98188"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pivX, pivY); ctx.lineTo(perpEx, perpEy); ctx.stroke();
      ctx.setLineDash([]);
      // Right-angle box at foot
      const bSize = 8;
      const bx = perpEx - Math.cos(perpDir)*bSize, by = perpEy - Math.sin(perpDir)*bSize;
      ctx.strokeStyle = "#10b981"; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(rodA)*bSize, by + Math.sin(rodA)*bSize);
      ctx.lineTo(bx + Math.cos(rodA)*bSize + Math.cos(perpDir)*bSize, by + Math.sin(rodA)*bSize + Math.sin(perpDir)*bSize);
      ctx.stroke();
      ctx.font="bold 11px 'Courier New'"; ctx.fillStyle="#10b981"; ctx.textAlign="center";
      ctx.fillText(`d⊥=${leverArm.toFixed(2)}m`, perpEx + Math.cos(perpDir)*22, perpEy + Math.sin(perpDir)*22);
    }

    // ── Angle arc between rod and force ──
    if (forceAngle > 5 && forceAngle < 175) {
      ctx.strokeStyle = "#a78bfa88"; ctx.lineWidth = 1.5; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.arc(forceX, forceY, 28, rodA + Math.PI, rodA + Math.PI + thetaRad); ctx.stroke();
      ctx.setLineDash([]);
      const midA = rodA + Math.PI + thetaRad * 0.5;
      ctx.font = "11px 'Courier New'"; ctx.fillStyle = "#a78bfa"; ctx.textAlign = "center";
      ctx.fillText(`${forceAngle}°`, forceX + Math.cos(midA)*42, forceY + Math.sin(midA)*42);
    }

    // ── Torque arc (rotational direction) ──
    const torqueSign = currentTau >= 0 ? 1 : -1;
    const arcR = halfRodPx * 0.55;
    if (Math.abs(currentTau) > 0.5) {
      const arcColor = currentTau > 0 ? "#f59e0b" : "#8b5cf6";
      drawArcArrow(ctx, pivX, pivY, arcR, rodA - 0.5, rodA + 0.8 * torqueSign, arcColor, currentTau > 0);
      ctx.font = "bold 13px 'Courier New'"; ctx.fillStyle = arcColor; ctx.textAlign = "center";
      ctx.fillText(`τ=${Math.abs(currentTau).toFixed(1)} N·m`, pivX + Math.cos(rodA+Math.PI/2)*arcR*1.55, pivY + Math.sin(rodA+Math.PI/2)*arcR*1.55 - 6);
    }

    // ── Pivot bearing ──
    // Outer ring
    const pivGlow = ctx.createRadialGradient(pivX,pivY,0,pivX,pivY,28);
    pivGlow.addColorStop(0, "#60a5fa66"); pivGlow.addColorStop(1,"transparent");
    ctx.fillStyle=pivGlow; ctx.beginPath(); ctx.arc(pivX,pivY,28,0,Math.PI*2); ctx.fill();

    // Bearing body
    const pivGrad = ctx.createRadialGradient(pivX-5,pivY-5,2,pivX,pivY,18);
    pivGrad.addColorStop(0,"#93c5fd"); pivGrad.addColorStop(0.4,"#3b82f6"); pivGrad.addColorStop(1,"#1e3a5f");
    ctx.beginPath(); ctx.arc(pivX,pivY,18,0,Math.PI*2);
    ctx.fillStyle=pivGrad; ctx.fill();
    ctx.strokeStyle="#60a5fa"; ctx.lineWidth=2; ctx.stroke();
    // Inner hub
    ctx.beginPath(); ctx.arc(pivX,pivY,6,0,Math.PI*2);
    ctx.fillStyle="white"; ctx.fill();

    // Pivot label
    ctx.font="10px 'Courier New'"; ctx.fillStyle="#64748b"; ctx.textAlign="center";
    ctx.fillText("PIVOT", pivX, pivY+34);

    // ── Angular velocity arc around pivot ──
    if (Math.abs(omegaRef.current) > 0.05) {
      const omColor = omegaRef.current > 0 ? "#06b6d4" : "#a78bfa";
      drawArcArrow(ctx, pivX, pivY, halfRodPx*0.8, rodA, rodA + Math.sign(omegaRef.current)*0.9, omColor, omegaRef.current>0);
      ctx.font="bold 11px 'Courier New'"; ctx.fillStyle=omColor; ctx.textAlign="center";
      const omLabelA = rodA + Math.sign(omegaRef.current)*0.45;
      ctx.fillText(`ω=${Math.abs(omegaRef.current).toFixed(2)} rad/s`,
        pivX + Math.cos(omLabelA)*(halfRodPx*0.8+22),
        pivY + Math.sin(omLabelA)*(halfRodPx*0.8+22));
    }

    // ── Force application point glow ──
    const appGlow = ctx.createRadialGradient(forceX,forceY,0,forceX,forceY,16);
    appGlow.addColorStop(0,"#ef4444cc"); appGlow.addColorStop(1,"transparent");
    ctx.fillStyle=appGlow; ctx.beginPath(); ctx.arc(forceX,forceY,16,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(forceX,forceY,7,0,Math.PI*2);
    const apGrad = ctx.createRadialGradient(forceX-2,forceY-2,1,forceX,forceY,7);
    apGrad.addColorStop(0,"#fff"); apGrad.addColorStop(1,"#ef4444");
    ctx.fillStyle=apGrad; ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=1.2; ctx.stroke();

    // ── τ = r × F cross product visualisation ──
    // Small "×" symbol at force point
    ctx.font="bold 18px 'Courier New'"; ctx.fillStyle="#f59e0bcc"; ctx.textAlign="center";
    ctx.fillText("×", forceX, forceY - 18);

    // ── Particles ──
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fillStyle = p.color; ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ── Info overlay ──
    const infoX = 14, infoY = 14;
    ctx.fillStyle="rgba(6,10,20,0.92)";
    ctx.beginPath(); ctx.roundRect(infoX,infoY,178,130,8); ctx.fill();
    ctx.strokeStyle="#1e3a5f"; ctx.lineWidth=1; ctx.stroke();
    ctx.font="9px 'Courier New'"; ctx.fillStyle="#334155"; ctx.textAlign="left";
    ctx.fillText("⚡ LIVE STATS", infoX+10, infoY+14);
    const stats = [
      ["τ (torque)",`${currentTau.toFixed(2)} N·m`, "#f59e0b"],
      ["α (ang.accel)",`${currentAlpha.toFixed(3)} rad/s²`, "#ef4444"],
      ["ω (ang.vel)", `${omegaRef.current.toFixed(3)} rad/s`, "#06b6d4"],
      ["KE (rot)",`${calcKE(currentI,omegaRef.current).toFixed(2)} J`, "#10b981"],
      ["L (ang.mom)",`${calcAngMom(currentI,omegaRef.current).toFixed(3)} kg·m²/s`, "#8b5cf6"],
    ];
    stats.forEach(([l,v,c],i) => {
      ctx.font="11px 'Courier New'";
      ctx.fillStyle="#475569"; ctx.fillText(l as string, infoX+10, infoY+30+i*20);
      ctx.fillStyle=c as string; ctx.textAlign="right";
      ctx.fillText(v as string, infoX+172, infoY+30+i*20);
      ctx.textAlign="left";
    });

    // ── Mode badge ──
    ctx.fillStyle = mode==="locked" ? "#10b98133" : "#3b82f633";
    ctx.beginPath(); ctx.roundRect(W-110, 12, 98, 26, 6); ctx.fill();
    ctx.strokeStyle = mode==="locked" ? "#10b981" : "#3b82f6"; ctx.lineWidth=1; ctx.stroke();
    ctx.font="bold 11px 'Courier New'"; ctx.fillStyle = mode==="locked" ? "#10b981":"#60a5fa"; ctx.textAlign="center";
    ctx.fillText(mode==="locked"?"🔒 LOCKED":"🔓 FREE SPIN", W-61, 29);

    // ── Time ──
    ctx.font="12px 'Courier New'"; ctx.fillStyle="#334155"; ctx.textAlign="left";
    ctx.fillText(`t=${timeRef.current.toFixed(1)}s`, W-100, H-14);

  }, [force, forceAngle, armDist, mass, rodLength, damping, mode, spawnBurst, leverArm]);

  useEffect(() => {
    let id: number;
    const loop = (now: number) => {
      draw(now);
      id = requestAnimationFrame(loop);
    };
    lastRef.current = performance.now();
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  const currentTau = calcTorque(force, armDist, forceAngle);
  const currentI   = calcI_rod(mass, rodLength);
  const currentAlpha = calcAlpha(currentTau, currentI);

  const S = (s: React.CSSProperties): React.CSSProperties => ({ fontFamily:"'Courier New',monospace", ...s });

  return (
    <div style={S({ background:"#060c18", minHeight:"100vh", display:"flex", flexDirection:"column", color:"#e2e8f0" })}>

      {/* ── HEADER ── */}
      <div style={S({ padding:"10px 22px", borderBottom:"1px solid #1e3a5f", background:"#040810", display:"flex", alignItems:"center", justifyContent:"space-between" })}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:"conic-gradient(#f59e0b,#ef4444,#8b5cf6,#3b82f6,#f59e0b)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:"white" }} />
          </div>
          <div>
            <div style={S({ fontSize:19, fontWeight:800, color:"#f59e0b", letterSpacing:2 })}>TORQUE & ROTATIONAL DYNAMICS</div>
            <div style={S({ fontSize:10, color:"#334155" })}>τ = r × F · α = τ/I · L = Iω · Interactive Rod Simulator</div>
          </div>
        </div>
        <button onClick={() => setMode(m => m==="free"?"locked":"free")}
          style={S({ padding:"7px 16px", borderRadius:7, border:`1px solid ${mode==="locked"?"#10b981":"#1e3a5f"}`, background:mode==="locked"?"#10b98122":"transparent", color:mode==="locked"?"#10b981":"#64748b", cursor:"pointer", fontSize:12 })}>
          {mode==="locked" ? "🔒 Rod Locked" : "🔓 Free Spin"}
        </button>
      </div>

      {/* ── MAIN ── */}
      <div style={{ display:"flex", height:"63vh", minHeight:420 }}>

        {/* Canvas */}
        <div style={{ flex:"0 0 65%", position:"relative", borderRight:"1px solid #1e3a5f" }}>
          <canvas ref={canvasRef} width={920} height={530}
            style={{ width:"100%", height:"100%", display:"block" }} />
        </div>

        {/* Controls */}
        <div style={S({ flex:"0 0 35%", padding:"14px 18px", overflowY:"auto", background:"#040810" })}>
          <div style={S({ fontSize:11, color:"#334155", marginBottom:10, letterSpacing:2 })}>⚙ PARAMETERS</div>

          {/* Sliders */}
          {[
            { label:"Force (F)",          value:force,      set:setForce,      min:1,   max:100,  step:1,   unit:"N",   color:"#ef4444", icon:"💪" },
            { label:"Force Angle (θ)",    value:forceAngle, set:setForceAngle, min:1,   max:179,  step:1,   unit:"°",   color:"#a78bfa", icon:"📐" },
            { label:"Arm Distance (r)",   value:armDist,    set:setArmDist,    min:0.1, max:2.4,  step:0.05,unit:"m",   color:"#f59e0b", icon:"📏" },
            { label:"Rod Mass (m)",       value:mass,       set:setMass,       min:0.5, max:10,   step:0.5, unit:"kg",  color:"#3b82f6", icon:"⚖" },
            { label:"Rod Length (L)",     value:rodLength,  set:setRodLength,  min:0.5, max:4.0,  step:0.1, unit:"m",   color:"#06b6d4", icon:"📍" },
            { label:"Damping (b)",        value:damping,    set:setDamping,    min:0,   max:0.8,  step:0.01,unit:"",    color:"#10b981", icon:"🌊" },
          ].map(p => (
            <div key={p.label} style={{ marginBottom:13 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={S({ fontSize:11, color:"#94a3b8" })}>{p.icon} {p.label}</span>
                <span style={S({ fontSize:13, fontWeight:700, color:p.color })}>
                  {p.value.toFixed(p.step<0.1?2:p.step<1?2:0)}
                  <span style={S({ fontSize:10, fontWeight:400, color:"#334155" })}> {p.unit}</span>
                </span>
              </div>
              <input type="range" min={p.min} max={p.max} step={p.step} value={p.value}
                onChange={e => p.set(Number(e.target.value))}
                aria-label={`${p.label}: ${p.value} ${p.unit}`}
                style={{ width:"100%", accentColor:p.color, cursor:"pointer", height:6 }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#1e3a5f", marginTop:1 }}>
                <span>{p.min}</span><span>{p.max}</span>
              </div>
            </div>
          ))}

          {/* Quick torque display */}
          <div style={{ background:"#080f1c", border:"1px solid #1e3a5f", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
            <div style={S({ fontSize:10, color:"#334155", marginBottom:7 })}>τ = F · r · sin(θ)</div>
            <div style={S({ fontSize:13, color:"#e2e8f0", marginBottom:4 })}>
              = <span style={{ color:"#ef4444" }}>{force}</span> ×{" "}
              <span style={{ color:"#f59e0b" }}>{armDist.toFixed(2)}</span> × sin(
              <span style={{ color:"#a78bfa" }}>{forceAngle}°</span>)
            </div>
            <div style={S({ fontSize:16, fontWeight:800, color:"#f59e0b" })}>
              = {Math.abs(currentTau).toFixed(2)} N·m
            </div>
            {/* Torque magnitude bar */}
            <div style={{ height:8, background:"#0a121e", borderRadius:4, marginTop:8 }}>
              <div style={{ height:"100%", width:`${Math.min(100,(Math.abs(currentTau)/240)*100)}%`,
                background:"linear-gradient(90deg,#f59e0b,#fde68a)", borderRadius:4, transition:"width 0.2s" }} />
            </div>
            <div style={S({ fontSize:10, color:"#475569", marginTop:4 })}>
              α = τ/I = {currentTau.toFixed(2)}/{currentI.toFixed(2)} = <strong style={{ color:"#ef4444" }}>{currentAlpha.toFixed(3)} rad/s²</strong>
            </div>
          </div>

          {/* Lever arm comparison */}
          <div style={{ background:"#080f1c", border:"1px solid #1e3a5f", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
            <div style={S({ fontSize:10, color:"#334155", marginBottom:8 })}>TORQUE vs ANGLE</div>
            {[30,60,90,120,150].map(a => {
              const t = calcTorque(force, armDist, a);
              return (
                <div key={a} style={{ marginBottom:5 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:2 }}>
                    <span style={S({ color: a===forceAngle?"#a78bfa":"#475569", fontWeight: a===forceAngle?700:400 })}>{a}°</span>
                    <span style={S({ color:"#94a3b8" })}>{Math.abs(t).toFixed(1)} N·m</span>
                  </div>
                  <div style={{ height:5, background:"#0a121e", borderRadius:3 }}>
                    <div style={{ height:"100%", width:`${(Math.abs(t)/Math.abs(calcTorque(force,armDist,90)))*100}%`,
                      background: a===forceAngle?"linear-gradient(90deg,#8b5cf6,#c4b5fd)":"linear-gradient(90deg,#1e3a5f,#334155)",
                      borderRadius:3, transition:"width 0.3s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div style={{ background:"#060912", border:"1px solid #1e3a5f", borderRadius:8, padding:"10px 12px", marginBottom:12, fontSize:11 }}>
            <div style={S({ color:"#f59e0b", fontWeight:700, marginBottom:5 })}>💡 Try This!</div>
            <div style={S({ color:"#64748b", lineHeight:1.9 })}>
              🎯 <strong style={{ color:"#60a5fa" }}>Max torque:</strong> θ=90°, r=2.4m, F=100N<br/>
              🌀 <strong style={{ color:"#a78bfa" }}>No torque:</strong> Set θ=0° or θ=180°<br/>
              ⚖ <strong style={{ color:"#34d399" }}>Lever law:</strong> Double r = double τ<br/>
              🔒 <strong style={{ color:"#fcd34d" }}>Lock rod:</strong> Toggle spin on/off
            </div>
          </div>
                <button
                  type="button"
                  onClick={() => setPlaying(p => !p)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  {playing ? "⏸ Pause" : "▶ Play"}
                </button>

          <button onClick={handleReset}
            style={S({ width:"100%", padding:"11px", borderRadius:8, background:"linear-gradient(135deg,#b45309,#f59e0b)", color:"white", border:"none", cursor:"pointer", fontWeight:800, fontSize:13, letterSpacing:1 })}
            onMouseEnter={e=>e.currentTarget.style.background="linear-gradient(135deg,#92400e,#d97706)"}
            onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(135deg,#b45309,#f59e0b)"}>↺ Reset</button>
        </div>
      </div>

      {/* ── BOTTOM PANEL ── */}
      <div style={{ borderTop:"1px solid #1e3a5f", background:"#040810", padding:"16px 26px", display:"flex", gap:22, minHeight:215 }}>

        {/* Left: concept */}
        <div style={{ flex:"0 0 36%" }}>
          <div style={S({ fontSize:13, fontWeight:700, color:"#f59e0b", marginBottom:10, borderBottom:"1px solid #1e3a5f", paddingBottom:6 })}>✨ The Concept</div>
          <p style={S({ fontSize:12, color:"#94a3b8", lineHeight:1.8, marginBottom:10 })}>
            <strong style={{ color:"#e2e8f0" }}>Torque (τ)</strong> is the rotational effect of a force. It depends on three things: force magnitude, how far from the pivot it's applied (moment arm), and the angle between force and rod. <em style={{ color:"#f59e0b" }}>Maximum torque</em> occurs at 90° — the force acts entirely perpendicular to the rod.
          </p>
          <p style={S({ fontSize:12, color:"#94a3b8", lineHeight:1.8 })}>
            The cross product <strong style={{ color:"#ef4444" }}>τ = r × F</strong> means only the perpendicular component of force contributes. The <em style={{ color:"#10b981" }}>perpendicular lever arm</em> d⊥ = r·sin(θ) makes this clear geometrically.
          </p>
          <div style={{ background:"#080f1c", borderRadius:8, padding:"10px 14px", border:"1px solid #1e3a5f", marginTop:10 }}>
            <div style={S({ fontSize:10, color:"#334155", marginBottom:7 })}>📐 KEY FORMULAE</div>
            {[
              ["Torque",         "τ = r × F = rF·sin(θ)",    "#f59e0b"],
              ["Ang. Accel",     "α = τ / I",                 "#ef4444"],
              ["Rod Inertia",    "I = (1/12)ML²",             "#3b82f6"],
              ["Ang. Momentum",  "L = Iω",                    "#8b5cf6"],
              ["Rot. KE",        "KE = ½Iω²",                 "#10b981"],
            ].map(([l,f,c])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                <span style={S({ color:"#475569" })}>{l}</span>
                <span style={S({ color:c, fontWeight:700 })}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: live calc */}
        <div style={{ flex:"0 0 32%", borderLeft:"1px solid #1e3a5f", paddingLeft:20 }}>
          <div style={S({ fontSize:13, fontWeight:700, color:"#8b5cf6", marginBottom:10, borderBottom:"1px solid #1e3a5f", paddingBottom:6 })}>📊 Live Calculation</div>
          <div style={{ background:"#080f1c", borderRadius:8, padding:"12px 14px", border:"1px solid #1e3a5f", fontSize:12, lineHeight:2.1 }}>
            <div style={S({ color:"#334155", fontSize:10 })}>Torque calculation:</div>
            <div style={S({ color:"#f59e0b" })}>τ = F · r · sin(θ)</div>
            <div style={S({ color:"#e2e8f0" })}>
              = <span style={{ color:"#ef4444" }}>{force}</span> ·{" "}
              <span style={{ color:"#f59e0b" }}>{armDist.toFixed(2)}</span> · sin(<span style={{ color:"#a78bfa" }}>{forceAngle}°</span>)
            </div>
            <div style={S({ color:"#fcd34d", fontWeight:700 })}>= {currentTau.toFixed(4)} N·m</div>
            <div style={{ height:1, background:"#1e3a5f", margin:"5px 0" }} />
            <div style={S({ color:"#334155", fontSize:10 })}>Angular acceleration:</div>
            <div style={S({ color:"#60a5fa" })}>α = τ / I = {currentTau.toFixed(2)} / {currentI.toFixed(3)}</div>
            <div style={S({ color:"#34d399", fontWeight:700 })}>= {currentAlpha.toFixed(4)} rad/s²</div>
          </div>
          <div style={{ marginTop:10, background:"#080f1c", borderRadius:8, padding:"10px 14px", border:"1px solid #1e3a5f", fontSize:11 }}>
            <div style={S({ color:"#334155", fontSize:10, marginBottom:5 })}>⚡ CURRENT STATE</div>
            <div style={S({ color:"#f59e0b" })}>Torque τ: <strong>{currentTau.toFixed(3)} N·m</strong></div>
            <div style={S({ color:"#ef4444" })}>Ang.Accel α: <strong>{currentAlpha.toFixed(3)} rad/s²</strong></div>
            <div style={S({ color:"#06b6d4" })}>Ang.Vel ω: <strong>{omegaRef.current.toFixed(3)} rad/s</strong></div>
            <div style={S({ color:"#10b981" })}>Rot. KE: <strong>{calcKE(currentI,omegaRef.current).toFixed(3)} J</strong></div>
            <div style={S({ color:"#8b5cf6" })}>Ang.Mom L: <strong>{calcAngMom(currentI,omegaRef.current).toFixed(3)} kg·m²/s</strong></div>
            <div style={S({ color:"#94a3b8" })}>Inertia I: <strong style={{ color:"#67e8f9" }}>{currentI.toFixed(4)} kg·m²</strong></div>
            <div style={S({ color:"#94a3b8" })}>Lever arm d⊥: <strong style={{ color:"#fcd34d" }}>{leverArm.toFixed(4)} m</strong></div>
          </div>
        </div>

        {/* Right: tips */}
        <div style={{ flex:1, borderLeft:"1px solid #1e3a5f", paddingLeft:20 }}>
          <div style={S({ fontSize:13, fontWeight:700, color:"#06b6d4", marginBottom:10, borderBottom:"1px solid #1e3a5f", paddingBottom:6 })}>💡 Try This for Drama!</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {[
              { icon:"🚀", title:"Maximum Torque",      desc:"F=100N · θ=90° · r=2.4m",     result:`τ = ${(100*2.4*Math.sin(Math.PI/2)).toFixed(0)} N·m — rod spins like crazy!`, color:"#f59e0b" },
              { icon:"🔮", title:"Zero Torque",          desc:"Set θ=0° or θ=180°",          result:"Force along rod → zero rotation. F pushes but can't spin!", color:"#8b5cf6" },
              { icon:"⚖",  title:"Lever Law",           desc:"Double r from 0.5m to 1.0m",  result:"Torque doubles! Same force, twice the rotational effect.", color:"#3b82f6" },
              { icon:"🌀", title:"Spin & Damp",         desc:"High F + low damping (b≈0)",   result:"Rod accelerates continuously — angular velocity soars!", color:"#10b981" },
            ].map(tip=>(
              <div key={tip.title} style={{ background:"#080f1c", border:`1px solid ${tip.color}44`, borderRadius:8, padding:"8px 13px" }}>
                <div style={S({ fontWeight:700, color:tip.color, fontSize:12, marginBottom:2 })}>{tip.icon} {tip.title}</div>
                <div style={S({ fontSize:11, color:"#334155", marginBottom:2 })}>{tip.desc}</div>
                <div style={S({ fontSize:11, color:"#94a3b8", fontStyle:"italic" })}>→ {tip.result}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── THEORY ── */}
      <div style={{ borderTop:"2px solid #1e3a5f", background:"#030609", padding:"18px 28px" }}>
        <div style={S({ fontSize:13, fontWeight:700, color:"#f59e0b", marginBottom:14, letterSpacing:1.5 })}>📚 PHYSICS THEORY — TORQUE & ROTATIONAL DYNAMICS</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:22, fontSize:12, color:"#64748b", lineHeight:1.85 }}>
          <div>
            <div style={S({ color:"#f59e0b", fontWeight:700, marginBottom:6 })}>Torque as a Cross Product</div>
            Torque is defined as the cross product τ = r × F, where r is the position vector from pivot to force application point, and F is the force vector. Its magnitude is |τ| = rF·sin(θ), where θ is the angle between r and F. This means a force directed exactly along the rod (θ=0° or 180°) produces zero torque — only the perpendicular component causes rotation. The perpendicular lever arm d⊥ = r·sin(θ) is the geometric distance from the pivot to the line of action of the force.
          </div>
          <div>
            <div style={S({ color:"#a78bfa", fontWeight:700, marginBottom:6 })}>Newton's 2nd Law for Rotation</div>
            The rotational analogue of F=ma is τ_net = I·α, where I is the moment of inertia and α is angular acceleration. For a uniform rod rotating about its centre, I = (1/12)ML². Angular momentum L = Iω is conserved when net torque is zero — the rotational equivalent of linear momentum conservation. The work-energy theorem applies: work done by torque equals the change in rotational kinetic energy (½Iω²).
          </div>
          <div>
            <div style={S({ color:"#67e8f9", fontWeight:700, marginBottom:6 })}>Engineering Applications</div>
            Torque and rotational dynamics underpin virtually all mechanical engineering. Wrenches, engines, turbines, gears, and electric motors all harness τ = r × F. A longer wrench arm (larger r) requires less force for the same torque. Internal combustion engines convert reciprocating linear force into crankshaft torque. Gyroscopes, centrifuges, helicopter rotors, and even DNA-unwinding enzymes follow these same rotational dynamics principles.
          </div>
        </div>
      </div>

      <div style={S({ borderTop:"1px solid #1e3a5f", padding:"7px 22px", background:"#020406", fontSize:10, color:"#1e3a5f", display:"flex", justifyContent:"space-between" })}>
        <span>Torque Simulator · τ = r × F · α = τ/I · SI Units</span>
        <span>I = ML²/12 (rod, centre pivot) · L = Iω conserved</span>
      </div>
    </div>
  );
}
