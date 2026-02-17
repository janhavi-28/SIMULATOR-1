/**
 * Physics topic metadata for SEO. Simulation loading is done client-side
 * via PhysicsSimulationLoader (next/dynamic with ssr: false).
 * All text is server-rendered for crawler indexing.
 */
export const physicsTopicMeta: Record<
  string,
  { title: string; description: string; keywords?: string[] }
> = {
  gravity: {
    title: "Gravity – Free fall & bounces | Physics",
    description:
      "Explore motion under gravity with an interactive simulator. Change g, mass, initial height and velocity, and try different worlds (Moon, Earth, Mars, Jupiter).",
    keywords: ["gravity", "free fall", "physics simulation", "kinematics", "motion", "acceleration due to gravity"],
  },
  "rutherford-gold-foil": {
    title: "Rutherford Gold Foil Experiment | Physics",
    description:
      "Interactive Rutherford scattering: α-particles, gold foil, and a tiny nucleus. Adjust Z, energy, and emission rate to see passing, scattered, and backscattered counts.",
    keywords: ["Rutherford", "gold foil experiment", "atomic structure", "alpha particles", "nucleus", "scattering"],
  },
  "projectile-motion": {
    title: "Projectile Motion Simulator | Physics",
    description:
      "Visualize 2D projectile motion with adjustable speed, launch angle, height and gravity. See the trajectory, time of flight, range and maximum height update in real time.",
    keywords: ["projectile motion", "2D motion", "kinematics", "trajectory", "physics simulation", "launch angle"],
  },
  "velocity-time-position-time-graphs": {
    title: "Velocity–Time and Position–Time Graphs | Physics",
    description:
      "Interactive v–t and x–t graphs for Class 11 kinematics. Adjust initial velocity, acceleration and initial position; see graphs and formulas update in real time.",
    keywords: ["velocity time graph", "position time graph", "kinematics", "uniformly accelerated motion", "physics"],
  },
  "relations-for-uniformly-accelerated-motion": {
    title: "Relations for Uniformly Accelerated Motion | Physics",
    description:
      "Explore v = u + at, s = ut + ½at² and v² = u² + 2as with an interactive 1D motion simulator. Adjust u, a and x₀; see position, velocity and the third relation update in real time.",
    keywords: ["uniformly accelerated motion", "kinematic equations", "physics formulas", "v=u+at", "motion"],
  },
  "special-relativity": {
    title: "Special Relativity – Time Dilation & Length Contraction | Physics",
    description:
      "Interactive special relativity simulator: moving spaceship and clocks. Adjust v/c to see time dilation (moving clock ticks slower) and length contraction. Formulas γ, Δt = γ Δτ, L = L₀/γ.",
    keywords: ["special relativity", "time dilation", "length contraction", "Einstein", "relativity simulation"],
  },
  "general-relativity": {
    title: "General Relativity – Spacetime Curvature & Gravitational Lensing | Physics",
    description:
      "Interactive general relativity demo: rubber-sheet spacetime and light bending. Adjust mass strength and impact parameter to see curvature and geodesic deflection. Formula α ≈ 4GM/(c²b).",
    keywords: ["general relativity", "spacetime curvature", "gravitational lensing", "Einstein", "gravity simulation"],
  },
  "black-holes": {
    title: "Black Holes – Event Horizon, Light Bending & Time Dilation | Physics",
    description:
      "Interactive black hole simulator: event horizon, bent light rays, and gravitational time dilation. Adjust mass and impact parameter; see r_s = 2GM/c² and time slowing near the horizon.",
    keywords: ["black hole", "event horizon", "Schwarzschild radius", "gravitational time dilation", "astrophysics"],
  },
  wormholes: {
    title: "Wormholes – Shortcuts in Spacetime | Physics",
    description:
      "Interactive wormhole simulator: 2D space folded into a tunnel. See shortcuts through spacetime and why wormholes are unstable. Adjust throat radius, curvature, and stability.",
    keywords: ["wormhole", "spacetime tunnel", "general relativity", "Einstein-Rosen bridge", "cosmology"],
  },
  "time-travel": {
    title: "Time Travel – Physics (CTCs) vs Sci-Fi | Physics",
    description:
      "Interactive time travel demo: closed timelike curves (CTCs), timeline splitting, and why paradoxes arise. Compare physics-allowed CTCs with Sci-Fi paradox zones. Adjust CTC strength, branches, and loop extent.",
    keywords: ["time travel", "closed timelike curves", "CTCs", "temporal paradox", "relativity"],
  },
  "double-slit": {
    title: "Double Slit Experiment | Physics",
    description:
      "Interactive double slit simulator: particles gradually form an interference pattern on the screen. Adjust wavelength, slit separation, and screen distance to see wave-particle duality and fringe spacing.",
    keywords: ["double slit experiment", "wave particle duality", "quantum mechanics", "interference", "Young experiment"],
  },
  "quantum-superposition": {
    title: "Quantum Superposition | Physics",
    description:
      "Interactive quantum superposition simulator: probability clouds for two overlapping states (Schrödinger's cat style). Adjust |α|², phase, spread, and separation to see interference and how measurement collapses the wave.",
    keywords: ["quantum superposition", "Schrödinger cat", "wave function", "quantum mechanics", "probability"],
  },
  "quantum-entanglement": {
    title: "Quantum Entanglement | Physics",
    description:
      "Interactive quantum entanglement simulator: two particles in a singlet state reacting together no matter the distance. Measure one and see the other correlate instantly. Adjust separation, correlation strength, and measurement angles.",
    keywords: ["quantum entanglement", "EPR paradox", "Bell states", "quantum correlation", "non-locality"],
  },
  "quantum-tunneling": {
    title: "Quantum Tunneling | Physics",
    description:
      "Interactive quantum tunneling simulator: particles passing through an energy barrier when E < V₀. See probability leak-through in real time. Adjust energy ratio, barrier width, and mass to observe how transmission probability T changes.",
    keywords: ["quantum tunneling", "potential barrier", "transmission probability", "quantum mechanics", "wave function"],
  },
  "wave-function-collapse": {
    title: "Wave Function Collapse | Physics",
    description:
      "Interactive wave function collapse simulator: fuzzy probability distribution before measurement, sharp outcome after. Adjust P(A), spread, and peak separation; click Measure to see collapse. Measurement changes outcome.",
    keywords: ["wave function collapse", "quantum measurement", "probability", "quantum mechanics", "observation"],
  },
  resonance: {
    title: "Resonance – Driven Oscillator | Physics",
    description:
      "Interactive resonance simulator: drive a damped harmonic oscillator and watch amplitude peak when driving frequency matches natural frequency. Adjust f₀, driving frequency, damping, and force for dramatic resonance effects.",
    keywords: ["resonance", "driven oscillator", "harmonic oscillator", "damping", "natural frequency", "oscillations and waves", "physics simulation"],
  },
  "physical-world-and-units": {
    title: "Physical World & Units – Scattering Explorer | Physics",
    description:
      "See how physical quantities and units (MeV, femtometre, relative mass) control Rutherford-style scattering of alpha particles from a massive nucleus, with live equations and parameter history.",
    keywords: [
      "physical world",
      "units",
      "Rutherford scattering",
      "measurement",
      "MeV",
      "fm",
      "Class 11 physics",
      "nuclear physics",
    ],
  },
  "fundamental-forces": {
    title: "Fundamental Forces of Nature | Physics",
    description:
      "Interactive scale explorer: slide from nuclear to atomic to planetary scale and see which fundamental force (strong, weak, electromagnetic, gravitational) dominates. Compare relative strengths with dynamic force bars.",
    keywords: [
      "fundamental forces",
      "gravity",
      "electromagnetic",
      "strong force",
      "weak force",
      "physical world",
      "measurement",
      "scale",
      "Class 11 physics",
    ],
  },
  "frame-of-reference": {
    title: "Frame of Reference | Physics",
    description:
      "Compare the same motion in two frames: ground (inertial) and train (moving). Adjust train velocity, ball speed and throw angle to see position and velocity transform by x′ = x − V·t and v′ = v − V.",
    keywords: [
      "frame of reference",
      "kinematics",
      "Galilean transformation",
      "relative motion",
      "inertial frame",
      "Class 11 physics",
      "Chapter 2",
    ],
  },
  "motion-in-a-straight-line": {
    title: "Motion in a Straight Line | Physics",
    description:
      "Interactive scale explorer: slide from nuclear to atomic to planetary scale and see which fundamental force dominates. Watch an object move in a straight line as the dominant force drives its motion. Dynamic force-strength comparison bars.",
    keywords: [
      "motion in a straight line",
      "kinematics",
      "rest and motion",
      "displacement",
      "velocity",
      "fundamental forces",
      "scale",
      "Class 11 physics",
      "Chapter 2",
    ],
  },
  "newtons-second-law-force-acceleration-lab": {
    title: "Newton's Second Law – Force & Acceleration Lab | Physics",
    description:
      "Apply variable force to a block, change mass, and see acceleration update live. Toggle friction and watch the free-body diagram and F vs a graph. F = ma in action.",
    keywords: [
      "Newton's second law",
      "F equals ma",
      "force",
      "acceleration",
      "mass",
      "free body diagram",
      "Laws of Motion",
      "Class 11 physics",
      "Chapter 3",
    ],
  },
  "newtons-cradle": {
    title: "Newton's Cradle | Physics",
    description:
      "Interactive Newton's Cradle: conservation of momentum and energy. Adjust ball count, mass, release angle, and gravity. Scale slider shows which fundamental force dominates from nuclear to planetary scales. Part of Work, Energy and Power.",
    keywords: [
      "Newton's Cradle",
      "conservation of momentum",
      "conservation of energy",
      "elastic collision",
      "pendulum",
      "Work Energy and Power",
      "Class 11 physics",
      "Chapter 4",
    ],
  },
  "banking-of-roads": {
    title: "Banking of Roads | Physics",
    description:
      "Interactive banking of roads simulator: adjust speed, radius and banking angle. See tan θ = v²/(rg), design speed, and force vectors (mg, N, Fc) in real time. Part of Laws of Motion.",
    keywords: [
      "banking of roads",
      "banked curve",
      "centripetal force",
      "normal force",
      "Laws of Motion",
      "uniform circular motion",
      "Class 11 physics",
      "Chapter 3",
    ],
  },
  "inclined-plane-friction-force-analysis": {
    title: "Inclined Plane & Friction – Force Analysis Lab | Physics",
    description:
      "Interactive inclined plane with friction: adjust angle, mass, coefficient of friction and gravity. See real-time free body diagram, force vectors, net force, acceleration and motion state (rest or sliding). F = ma and component resolution in action.",
    keywords: [
      "inclined plane",
      "friction",
      "force analysis",
      "free body diagram",
      "Laws of Motion",
      "Newton",
      "static friction",
      "kinetic friction",
      "Class 11 physics",
      "Chapter 3",
    ],
  },
  "motion-in-a-plane": {
    title: "Motion in a Plane | Physics",
    description:
      "Interactive scale slider from nuclear to atomic to planetary scale: see which force dominates at each scale and watch 2D trajectories in the plane. Dynamic force-strength comparison bars and real-time trajectory.",
    keywords: [
      "motion in a plane",
      "kinematics",
      "two-dimensional motion",
      "trajectory",
      "fundamental forces",
      "scale",
      "Class 11 physics",
      "Chapter 2",
    ],
  },
  "work-energy-theorem": {
    title: "The Work-Energy Theorem | Physics",
    description:
      "Interactive Work-Energy Theorem simulator: explore how friction stops a sliding block. Adjust mass, initial velocity, and friction to see stopping distance and work done. Net Work = ΔKE; −fₖ·d = 0 − ½mvᵢ². Senior Secondary Physics, Work, Energy and Power.",
    keywords: [
      "work-energy theorem",
      "work energy and power",
      "kinetic energy",
      "friction",
      "stopping distance",
      "physics simulation",
      "Class 11 physics",
      "Chapter 4",
      "Senior Secondary",
    ],
  },
  "rotational-inertia-moment": {
    title: "Rotational Inertia Moment | Physics",
    description:
      "Interactive Rotational Inertia Lab: solid disk vs ring rolling down an inclined plane. Same mass and radius—different mass distribution. Compare I = ½MR² (disk) and I = MR² (ring); see energy split (translational vs rotational KE) and why the disk wins.",
    keywords: [
      "rotational inertia",
      "moment of inertia",
      "rolling without slipping",
      "inclined plane",
      "disk",
      "ring",
      "rigid body",
      "Motion of System of Particles and Rigid Body",
      "Class 11 physics",
      "Chapter 5",
    ],
  },
};
