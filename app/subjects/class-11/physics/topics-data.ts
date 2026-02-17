export type PhysicsTopic = {
  id: string;
  title: string;
};

export const physicsTopicsByChapter: Record<string, PhysicsTopic[]> = {
  "physical-world-and-measurement": [
    {
      id: "physical-world-and-units",
      title: "Physical World & Units – Scattering Explorer",
    },
    {
      id: "fundamental-forces",
      title: "Fundamental Forces of Nature",
    },
  ],
  "laws-of-motion": [
    {
      id: "newtons-second-law-force-acceleration-lab",
      title: "Newton's Second Law – Force & Acceleration Lab",
    },
    {
      id: "inclined-plane-friction-force-analysis",
      title: "Inclined Plane & Friction – Force Analysis Lab",
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
      id: "relations-for-uniformly-accelerated-motion",
      title: "Relations for Uniformly Accelerated Motion",
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

  "oscillations-and-waves": [
    { id: "simple-harmonic-motion", title: "Simple Harmonic Motion" },
    { id: "oscillations-spring-and-pendulum", title: "Oscillations – Spring and Pendulum" },
    { id: "resonance", title: "Resonance" },
    { id: "wave-motion", title: "Wave Motion" },
    { id: "longitudinal-and-transverse-waves", title: "Longitudinal and Transverse Waves" },
    { id: "sound-waves", title: "Sound Waves" },
    { id: "doppler-effect", title: "Doppler Effect" },
  ],
};

