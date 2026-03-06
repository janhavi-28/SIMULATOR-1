export type PhysicsTopic = {
  id: string;
  title: string;
};

export const physicsTopicsByChapter: Record<string, PhysicsTopic[]> = {
  "physical-world-and-measurement": [
    {
      id: "physical-world-and-units",
      title: "Physical World & Units - Scattering Explorer",
    },
    {
      id: "fundamental-forces",
      title: "Fundamental Forces of Nature",
    },
  ],

  "laws-of-motion": [
    {
      id: "newtons-second-law-force-acceleration-lab",
      title: "Newton's Second Law - Force & Acceleration Lab",
    },
    {
      id: "inclined-plane-friction-force-analysis",
      title: "Inclined Plane & Friction - Force Analysis Lab",
    },
    {
      id: "banking-of-roads",
      title: "Banking of Roads",
    },
  ],

  kinematics: [
    { id: "frame-of-reference", title: "Frame of Reference" },
    {
      id: "motion-in-a-straight-line",
      title: "Motion in a Straight Line",
    },
    {
      id: "velocity-time-position-time-graphs",
      title: "Velocity-Time and Position-Time Graphs",
    },
    {
      id: "motion-in-a-plane",
      title: "Motion in a Plane",
    },
    {
      id: "projectile-motion",
      title: "Projectile Motion",
    },
    {
      id: "uniform-circular-motion",
      title: "Uniform Circular Motion",
    },
  ],

  "work-energy-and-power": [
    {
      id: "work-energy-theorem",
      title: "The Work-Energy Theorem",
    },
    { id: "newtons-cradle", title: "Newton's Cradle" },
    {
      id: "conservation-of-mechanical-energy",
      title: "Conservation of Mechanical Energy",
    },
  ],


  gravitation: [
    {
      id: "universal-law-of-gravitation",
      title: "Universal Law of Gravitation",
    },
    {
      id: "acceleration-due-to-gravity",
      title: "Acceleration Due to Gravity (g)",
    },
    {
      id: "escape-velocity",
      title: "Escape Velocity",
    },
    {
      id: "orbital-velocity",
      title: "Orbital Velocity of a Satellite",
    },
    {
      id: "gravitational-potential",
      title: "Gravitational Potential",
    },
    {
      id: "gravitational-potential-energy",
      title: "Gravitational Potential Energy",
    },
    {
      id: "keplers-laws-of-planetary-motion",
      title: "Kepler's Laws of Planetary Motion",
    },
    {
      id: "variation-of-g",
      title: "Variation of g with Altitude and Depth",
    },
  ],
  thermodynamics: [
    {
      id: "heat-transfer-conduction-convection-radiation",
      title: "Heat Transfer: Conduction, Convection and Radiation",
    },
    {
      id: "thermodynamic-systems-and-processes",
      title: "Thermodynamic Systems and Processes",
    },
      {
      id: "work-done-by-gas",
      title: "Work Done by Gas",
    },
],

  "oscillations-and-waves": [
    { id: "simple-harmonic-motion", title: "Simple Harmonic Motion" },
    {
      id: "oscillations-spring-and-pendulum",
      title: "Oscillations - Spring and Pendulum",
    },
    { id: "resonance", title: "Resonance" },
    { id: "wave-motion", title: "Wave Motion" },
    {
      id: "longitudinal-and-transverse-waves",
      title: "Longitudinal and Transverse Waves",
    },
    { id: "sound-waves", title: "Sound Waves" },
    { id: "doppler-effect", title: "Doppler Effect" },
  ],
  "motion-of-system-of-particles-and-rigid-body": [
    {
      id: "centre-of-mass",
      title: "Center of Mass",
    },
    {
      id: "moment-of-inertia",
      title: "Moment of Inertia",
    },
    {
      id: "rolling-motion",
      title: "Rolling Motion",
    },
    {
      id: "torque-and-rotational-dynamics",
      title: "Torque and Rotational Dynamics",
    },
  ],          
};
