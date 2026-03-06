"use client";
import React from "react";

// ─── Crisp SVG Diagram ────────────────────────────────────────────────────────
// Earth cx=115 cy=200 r=46  |  Sun cx=510 cy=190 r=130  |  viewBox=700×380
const GravitationDiagram: React.FC = () => (
  <svg
    viewBox="0 0 700 380"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "auto", display: "block", borderRadius: 12 }}
  >
    <defs>
      {/* BG */}
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#0b1828" />
        <stop offset="100%" stopColor="#0f2040" />
      </linearGradient>

      {/* ── Sun gradients ── */}
      <radialGradient id="sunCore" cx="38%" cy="32%" r="68%">
        <stop offset="0%"   stopColor="#FFFDF0" />
        <stop offset="18%"  stopColor="#FEF3A0" />
        <stop offset="42%"  stopColor="#FCD34D" />
        <stop offset="68%"  stopColor="#F97316" />
        <stop offset="88%"  stopColor="#EA580C" />
        <stop offset="100%" stopColor="#9A3412" />
      </radialGradient>
      <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#FDE68A" stopOpacity="0.40" />
        <stop offset="45%"  stopColor="#FB923C" stopOpacity="0.20" />
        <stop offset="80%"  stopColor="#F97316" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#C2410C" stopOpacity="0" />
      </radialGradient>
      {/* granule hotspots */}
      <radialGradient id="sg1" cx="28%" cy="26%" r="32%">
        <stop offset="0%"   stopColor="#FFFBEB" stopOpacity="0.55"/>
        <stop offset="100%" stopColor="#FCD34D" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="sg2" cx="68%" cy="58%" r="28%">
        <stop offset="0%"   stopColor="#FEF9C3" stopOpacity="0.40"/>
        <stop offset="100%" stopColor="#FCD34D" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="sg3" cx="50%" cy="78%" r="24%">
        <stop offset="0%"   stopColor="#FEF3C7" stopOpacity="0.35"/>
        <stop offset="100%" stopColor="#FCD34D" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="sg4" cx="80%" cy="28%" r="22%">
        <stop offset="0%"   stopColor="#FFFBEB" stopOpacity="0.30"/>
        <stop offset="100%" stopColor="#FCD34D" stopOpacity="0"/>
      </radialGradient>
      <clipPath id="sunClip"><circle cx="510" cy="190" r="130"/></clipPath>

      {/* ── Earth gradients ── */}
      <radialGradient id="earthSea" cx="36%" cy="32%" r="68%">
        <stop offset="0%"   stopColor="#93C5FD" />
        <stop offset="35%"  stopColor="#3B82F6" />
        <stop offset="75%"  stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#0A3478" />
      </radialGradient>
      <radialGradient id="earthAtm" cx="50%" cy="50%" r="50%">
        <stop offset="72%"  stopColor="#60A5FA" stopOpacity="0"/>
        <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.45"/>
      </radialGradient>
      <radialGradient id="earthSpec" cx="28%" cy="25%" r="50%">
        <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.55"/>
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
      </radialGradient>
      <clipPath id="earthClip"><circle cx="115" cy="200" r="46"/></clipPath>

      {/* ── Arrow markers ── */}
      <marker id="aR" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
        <path d="M0,0 L0,8 L10,4 z" fill="#7DD3FC"/>
      </marker>
      <marker id="aL" markerWidth="10" markerHeight="10" refX="2" refY="4" orient="auto">
        <path d="M10,0 L10,8 L0,4 z" fill="#7DD3FC"/>
      </marker>
    </defs>

    {/* Background */}
    <rect width="700" height="380" fill="url(#bg)" rx="12"/>

    {/* Stars */}
    {([
      [22,16,1.3,0.70],[55,28,1.0,0.55],[95,18,1.2,0.62],[148,12,1.0,0.52],
      [210,22,0.9,0.48],[278,10,1.4,0.68],[345,20,1.1,0.55],[402,15,1.0,0.58],
      [468,10,0.9,0.50],[528,24,1.3,0.62],[580,14,1.0,0.55],[622,30,0.8,0.45],
      [670,18,1.1,0.58],[15,60,0.9,0.48],[60,75,1.1,0.52],[185,45,1.0,0.50],
      [255,60,0.8,0.45],[490,55,1.0,0.52],[640,55,0.9,0.48],[330,8,0.8,0.44],
    ] as [number,number,number,number][]).map(([cx,cy,r,o],i)=>(
      <circle key={i} cx={cx} cy={cy} r={r} fill={`rgba(255,255,255,${o})`}/>
    ))}

    {/* ══ SUN (cx=510, cy=190, r=130) ══════════════════════════════════════ */}
    {/* multi-layer corona glow */}
    <circle cx="510" cy="190" r="168" fill="url(#sunGlow)" opacity="0.6"/>
    <circle cx="510" cy="190" r="152" fill="url(#sunGlow)" opacity="0.7"/>
    <circle cx="510" cy="190" r="138" fill="url(#sunGlow)"/>
    {/* body */}
    <circle cx="510" cy="190" r="130" fill="url(#sunCore)"/>
    {/* texture overlays */}
    <circle cx="510" cy="190" r="130" fill="url(#sg1)" clipPath="url(#sunClip)"/>
    <circle cx="510" cy="190" r="130" fill="url(#sg2)" clipPath="url(#sunClip)"/>
    <circle cx="510" cy="190" r="130" fill="url(#sg3)" clipPath="url(#sunClip)"/>
    <circle cx="510" cy="190" r="130" fill="url(#sg4)" clipPath="url(#sunClip)"/>
    {/* granule blobs */}
    {([
      [478,155,26,22],[535,162,20,17],[488,198,23,19],[522,208,17,14],
      [558,180,15,13],[462,190,16,14],[508,168,13,11],[496,220,19,16],
      [544,148,14,12],[470,218,13,11],[555,210,12,10],[530,140,10,9],
    ] as number[][]).map(([bx,by,rx,ry],i)=>(
      <ellipse key={i} cx={bx} cy={by} rx={rx} ry={ry}
        fill="rgba(255,248,200,0.16)" clipPath="url(#sunClip)"/>
    ))}
    {/* m₂ label */}
    <text x="458" y="100" fontFamily="Georgia,serif" fontStyle="italic"
      fontSize="22" fontWeight="700" fill="#E2E8F0">m₂</text>

    {/* ══ EARTH (cx=115, cy=200, r=46) ══════════════════════════════════════ */}
    {/* atmosphere */}
    <circle cx="115" cy="200" r="60" fill="url(#earthAtm)"/>
    {/* ocean */}
    <circle cx="115" cy="200" r="46" fill="url(#earthSea)"/>
    {/* continents */}
    <ellipse cx="104" cy="184" rx="16" ry="22" fill="#22C55E" opacity="0.88" clipPath="url(#earthClip)"/>
    <ellipse cx="126" cy="193" rx="13" ry="19" fill="#16A34A" opacity="0.85" clipPath="url(#earthClip)"/>
    <ellipse cx="110" cy="214" rx="10" ry="10" fill="#4ADE80" opacity="0.72" clipPath="url(#earthClip)"/>
    <ellipse cx="97"  cy="210" rx="7"  ry="6"  fill="#15803D" opacity="0.72" clipPath="url(#earthClip)"/>
    <ellipse cx="130" cy="178" rx="8"  ry="7"  fill="#22C55E" opacity="0.65" clipPath="url(#earthClip)"/>
    <ellipse cx="120" cy="218" rx="6"  ry="5"  fill="#166534" opacity="0.60" clipPath="url(#earthClip)"/>
    {/* polar caps */}
    <ellipse cx="115" cy="155" rx="16" ry="8"  fill="#DBEAFE" opacity="0.88" clipPath="url(#earthClip)"/>
    <ellipse cx="115" cy="244" rx="13" ry="7"  fill="#DBEAFE" opacity="0.78" clipPath="url(#earthClip)"/>
    {/* specular */}
    <circle cx="115" cy="200" r="46" fill="url(#earthSpec)"/>
    {/* m₁ label */}
    <text x="70" y="170" fontFamily="Georgia,serif" fontStyle="italic"
      fontSize="22" fontWeight="700" fill="#E2E8F0">m₁</text>

    {/* ══ DISTANCE MARKER "r" ═══════════════════════════════════════════════ */}
    {/* vertical drop lines */}
    <line x1="115" y1="154" x2="115" y2="58"
      stroke="rgba(180,210,255,0.55)" strokeWidth="1.4" strokeDasharray="5,5"/>
    <line x1="380" y1="80"  x2="380" y2="58"
      stroke="rgba(180,210,255,0.55)" strokeWidth="1.4" strokeDasharray="5,5"/>
    {/* horizontal bar */}
    <line x1="115" y1="60" x2="380" y2="60"
      stroke="rgba(180,210,255,0.70)" strokeWidth="1.6" strokeDasharray="5,5"/>
    {/* end caps */}
    <line x1="115" y1="52" x2="115" y2="68" stroke="rgba(180,210,255,0.80)" strokeWidth="1.8"/>
    <line x1="380" y1="52" x2="380" y2="68" stroke="rgba(180,210,255,0.80)" strokeWidth="1.8"/>
    {/* "r" label */}
    <text x="248" y="50" fontFamily="Georgia,serif" fontStyle="italic"
      fontSize="22" fontWeight="700" fill="#E2E8F0" textAnchor="middle">r</text>

    {/* ══ FORCE ARROWS ══════════════════════════════════════════════════════ */}
    {/* Earth → Sun direction */}
    <line x1="168" y1="200" x2="258" y2="200"
      stroke="#7DD3FC" strokeWidth="2.2" strokeDasharray="7,6" markerEnd="url(#aR)"/>
    {/* Sun → Earth direction */}
    <line x1="376" y1="190" x2="285" y2="190"
      stroke="#7DD3FC" strokeWidth="2.2" strokeDasharray="7,6" markerEnd="url(#aL)"/>

    {/* ══ FORMULAS ══════════════════════════════════════════════════════════ */}
    {/* Under Earth */}
    <text x="38"  y="308" fontFamily="Georgia,serif" fontStyle="italic"
      fontSize="17" fontWeight="700" fill="#7DC8FF">F⃗g</text>
    <text x="70"  y="308" fontFamily="Georgia,serif"
      fontSize="17" fill="#CBD5E1"> = </text>
    <text x="118" y="300" fontFamily="Georgia,serif" fontStyle="italic"
      fontSize="15" fill="#CBD5E1" textAnchor="middle">Gm₁m₂</text>
    <line x1="40" y1="306" x2="196" y2="306" stroke="#CBD5E1" strokeWidth="1.2"/>
    <text x="118" y="322" fontFamily="Georgia,serif" fontStyle="italic"
      fontSize="15" fill="#CBD5E1" textAnchor="middle">r²</text>

    {/* Under Sun */}
    <text x="440" y="308" fontFamily="Georgia,serif" fontStyle="italic"
      fontSize="17" fontWeight="700" fill="#7DC8FF">F⃗g</text>
    <text x="472" y="308" fontFamily="Georgia,serif"
      fontSize="17" fill="#CBD5E1"> = </text>
    <text x="570" y="300" fontFamily="Georgia,serif" fontStyle="italic"
      fontSize="15" fill="#CBD5E1" textAnchor="middle">Gm₁m₂</text>
    <line x1="444" y1="306" x2="650" y2="306" stroke="#CBD5E1" strokeWidth="1.2"/>
    <text x="570" y="322" fontFamily="Georgia,serif" fontStyle="italic"
      fontSize="15" fill="#CBD5E1" textAnchor="middle">r²</text>
  </svg>
);

// ─── Reusable section title ───────────────────────────────────────────────────
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.15em",
    textTransform: "uppercase" as const, color: "#3B82F6",
    marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
  }}>
    {children}
    <span style={{ flex: 1, height: 1, background: "rgba(100,160,255,0.15)" }} />
  </div>
);

// ─── Variable row ─────────────────────────────────────────────────────────────
const VarRow: React.FC<{ sym: string; desc: React.ReactNode }> = ({ sym, desc }) => (
  <div style={{
    display: "grid", gridTemplateColumns: "44px 1fr", gap: "0 14px",
    padding: "11px 0", borderBottom: "1px solid rgba(100,160,255,0.08)",
    fontSize: "0.89rem", alignItems: "baseline",
  }}>
    <span style={{
      fontFamily: "JetBrains Mono, Consolas, monospace",
      color: "#60A5FA", fontWeight: 600, fontSize: "0.98rem",
    }}>{sym}</span>
    <span style={{ color: "#7fa0c4", lineHeight: 1.65 }}>{desc}</span>
  </div>
);

// ─── Inverse square row ───────────────────────────────────────────────────────
const IsqRow: React.FC<{ r: string; desc: string; val: string }> = ({ r, desc, val }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 14,
    background: "rgba(6,13,30,0.6)", border: "1px solid rgba(100,160,255,0.09)",
    borderRadius: 10, padding: "11px 16px",
  }}>
    <span style={{
      fontFamily: "JetBrains Mono, Consolas, monospace",
      color: "#60A5FA", fontWeight: 600, fontSize: "0.87rem", flex: "0 0 52px",
    }}>{r}</span>
    <span style={{ color: "#7fa0c4", fontSize: "0.87rem", lineHeight: 1.45, flex: 1 }}>{desc}</span>
    <span style={{
      fontFamily: "JetBrains Mono, Consolas, monospace",
      color: "#3d5470", fontSize: "0.81rem", whiteSpace: "nowrap" as const,
    }}>{val}</span>
  </div>
);

// ─── Key insight point ────────────────────────────────────────────────────────
const Point: React.FC<{ n: number; title: string; body: string }> = ({ n, title, body }) => (
  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", fontSize: "0.89rem", color: "#7fa0c4", lineHeight: 1.7 }}>
    <span style={{
      flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
      background: "linear-gradient(135deg,#1e40af,#3B82F6)",
      color: "#fff", fontSize: "0.63rem", fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginTop: 2, boxShadow: "0 0 8px rgba(59,130,246,0.35)",
    }}>{n}</span>
    <span>
      <strong style={{ color: "#a8c8e8", fontWeight: 600 }}>{title}: </strong>
      {body}
    </span>
  </div>
);

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{
    background: "rgba(13,27,52,0.88)",
    border: "1px solid rgba(100,160,255,0.14)",
    borderRadius: 18,
    boxShadow: "0 6px 40px rgba(0,0,0,0.45)",
    ...style,
  }}>
    {children}
  </div>
);

// ─── Deterministic starfield ──────────────────────────────────────────────────
const Stars: React.FC = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
    {Array.from({ length: 22 }).map((_, i) => ({
      x: ((i * 263 + 17) % 100).toFixed(1),
      y: ((i * 179 + 53) % 100).toFixed(1),
      s: (0.8 + (i % 3) * 0.7),
      o: (0.22 + (i % 5) * 0.09).toFixed(2),
    })).map((s, i) => (
      <div key={i} style={{
        position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
        width: s.s * 2, height: s.s * 2, borderRadius: "50%",
        background: `rgba(255,255,255,${s.o})`,
      }} />
    ))}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GravitationPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 10%, #0a1628 0%, #071020 40%, #030a18 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      color: "#c8d8f0",
      lineHeight: 1.6,
    }}>
      <Stars />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "40px 28px 64px" }}>

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <header style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{
            fontSize: "clamp(1.7rem,3vw,2.3rem)", fontWeight: 700,
            color: "#e8f0ff", letterSpacing: "-0.01em", margin: "0 0 6px",
          }}>
            Universal Law of{" "}
            <span style={{
              background: "linear-gradient(90deg,#60A5FA,#7DD3FC,#93C5FD)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Gravitation</span>
          </h1>
          <p style={{ fontSize: "0.88rem", color: "#3d5470", letterSpacing: "0.04em", margin: 0 }}>
            Isaac Newton &nbsp;·&nbsp; Principia Mathematica &nbsp;·&nbsp; 1687
          </p>
          <div style={{
            width: 80, height: 2, margin: "12px auto 0",
            background: "linear-gradient(90deg,transparent,#3B82F6,transparent)",
          }} />
        </header>

        {/* ── HERO CARD: diagram left, theory right ─────────────────────── */}
        <Card style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          marginBottom: 24,
          overflow: "hidden",
        }}>
          {/* Left: SVG diagram + formula */}
          <div style={{
            background: "rgba(8,18,38,0.75)",
            borderRight: "1px solid rgba(100,160,255,0.12)",
            padding: "24px 20px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
          }}>
            <GravitationDiagram />

            {/* Compact formula */}
            <div style={{
              width: "100%", background: "rgba(4,10,24,0.85)",
              border: "1px solid rgba(100,160,255,0.2)",
              borderRadius: 10, padding: "14px 16px", textAlign: "center",
            }}>
              <div style={{
                fontSize: "0.63rem", letterSpacing: "0.13em",
                textTransform: "uppercase" as const,
                color: "#3B82F6", fontFamily: "monospace", marginBottom: 7,
              }}>Newton's Law</div>
              <div style={{
                fontSize: "1.3rem", fontWeight: 700, color: "#e2ecff",
                letterSpacing: "0.04em", fontFamily: "JetBrains Mono, Consolas, monospace",
              }}>F = Gm₁m₂ / r²</div>
              <div style={{
                marginTop: 10, fontSize: "0.73rem",
                color: "#3d5470", fontFamily: "monospace",
                lineHeight: 2, textAlign: "left" as const,
              }}>
                <span style={{ color: "#60A5FA", fontWeight: 600 }}>F</span>{" = gravitational force (N)"}<br />
                <span style={{ color: "#60A5FA", fontWeight: 600 }}>G</span>{" = 6.674×10⁻¹¹ N·m²/kg²"}<br />
                <span style={{ color: "#60A5FA", fontWeight: 600 }}>m₁, m₂</span>{" = masses of bodies (kg)"}<br />
                <span style={{ color: "#60A5FA", fontWeight: 600 }}>r</span>{" = centre-to-centre distance (m)"}
              </div>
            </div>
          </div>

          {/* Right: theory */}
          <div style={{ padding: "32px 36px" }}>
            <SectionTitle>The Concept</SectionTitle>
            <h2 style={{
              fontSize: "1.3rem", fontWeight: 700, color: "#d4e6ff",
              marginBottom: 16, letterSpacing: "-0.01em",
            }}>Every Mass Attracts Every Other Mass</h2>
            <div style={{ fontSize: "0.94rem", color: "#7fa0c4", lineHeight: 1.85 }}>
              <p style={{ marginBottom: 14 }}>
                Newton's Law of Universal Gravitation states that every particle of matter in
                the universe attracts every other particle with a force that acts along the
                line joining them. As the diagram shows,{" "}
                <strong style={{ color: "#a8c8e8" }}>Earth pulls the Sun and the Sun pulls
                Earth</strong> — equal in magnitude, opposite in direction — exactly as
                Newton's Third Law requires.
              </p>
              <p style={{ marginBottom: 14 }}>
                The force has two key dependencies. It is{" "}
                <strong style={{ color: "#a8c8e8" }}>directly proportional to the product
                of the two masses</strong>: double either mass and the force doubles. It also
                obeys the{" "}
                <span style={{ color: "#60A5FA", fontWeight: 500 }}>inverse-square law</span>:
                double the distance <strong style={{ color: "#a8c8e8" }}>r</strong> and the
                force drops to one-quarter; triple it and the force falls to one-ninth. This
                rapid decay with distance explains why the Sun's gravity does not dominate
                over Earth's for objects on the surface, despite the Sun being 333,000× more
                massive.
              </p>
              <p style={{ marginBottom: 0 }}>
                This single equation unified two previously separate phenomena — falling
                objects on Earth and the orbital motion of planets — revealing them to be
                governed by the{" "}
                <span style={{ color: "#60A5FA", fontWeight: 500 }}>same universal force</span>.
                It remains accurate to better than 1 part in 10⁵ for virtually all engineering
                and planetary calculations.
              </p>
            </div>
          </div>
        </Card>

        {/* ── BOTTOM GRID ───────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Variables */}
          <Card style={{ padding: "26px 28px" }}>
            <SectionTitle>Variables &amp; Constants</SectionTitle>
            <div>
              <VarRow sym="F" desc={<>Always <strong style={{ color: "#a8c8e8" }}>attractive</strong> — both bodies feel the same force magnitude, opposite directions.</>} />
              <VarRow sym="G" desc={<><strong style={{ color: "#a8c8e8" }}>6.674 × 10⁻¹¹ N·m²/kg²</strong> — measured by Cavendish in 1798 using a torsion balance.</>} />
              <VarRow sym="m₁" desc={<>Mass of first body. Earth ≈ <strong style={{ color: "#a8c8e8" }}>5.97 × 10²⁴ kg</strong>.</>} />
              <VarRow sym="m₂" desc={<>Mass of second body. Sun ≈ <strong style={{ color: "#a8c8e8" }}>1.99 × 10³⁰ kg</strong>.</>} />
              <VarRow sym="r"  desc={<>Centre-to-centre separation. Appears <strong style={{ color: "#a8c8e8" }}>squared</strong> — the most sensitive variable in the law.</>} />
            </div>
          </Card>

          {/* Inverse-square */}
          <Card style={{ padding: "26px 28px" }}>
            <SectionTitle>Inverse-Square Law</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <IsqRow r="r = 1×"  desc="Baseline separation"                        val="F = F₀"    />
              <IsqRow r="r = 2×"  desc="Double the distance — force drops to ¼"      val="F₀ / 4"   />
              <IsqRow r="r = 3×"  desc="Triple the distance — force drops to 1/9"    val="F₀ / 9"   />
              <IsqRow r="r = 10×" desc="Ten times the distance — only 1% remains"    val="F₀ / 100" />
            </div>
          </Card>
        </div>

        {/* ── KEY INSIGHTS ──────────────────────────────────────────────── */}
        <Card style={{ padding: "26px 28px", marginBottom: 20 }}>
          <SectionTitle>Key Insights</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Point n={1} title="Mutual & equal forces"
              body="Both Earth and the Sun are pulled toward each other with exactly the same force magnitude — Newton's Third Law applied to gravity, shown by the equal dashed arrows in the diagram." />
            <Point n={2} title="Truly universal"
              body="The same constant G applies from laboratory masses to galaxy clusters. No classical exception has ever been observed across any scale or substance in the universe." />
            <Point n={3} title="Kepler's Third Law derived"
              body="Setting gravitational force equal to centripetal force gives T² ∝ r³ — planets farther from the Sun complete their orbits far more slowly, exactly as Kepler observed." />
            <Point n={4} title="Superseded by General Relativity"
              body="Einstein's 1915 theory describes gravity as spacetime curvature and is more accurate in extreme fields. Newton's law stays correct to <0.001% for everyday planetary and engineering work." />
          </div>
        </Card>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer style={{
          textAlign: "center", marginTop: 44,
          fontSize: "0.82rem", color: "#243040", fontStyle: "italic",
        }}>
          "I can calculate the motion of heavenly bodies, but not the madness of people." — Isaac Newton
        </footer>

      </div>
    </div>
  );
}