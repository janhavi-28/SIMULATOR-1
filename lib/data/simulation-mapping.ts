/**
 * Mapping of simulations to categories:
 * - senior-secondary: Class 11/12 syllabus topics
 * - trending-topics: Standalone conceptual sims (not in syllabus)
 */
export const SENIOR_SECONDARY_PHYSICS_SIMS = [
  "projectile-motion",
  "velocity-time-position-time-graphs",
  "relations-for-uniformly-accelerated-motion",
] as const;

export const TRENDING_TOPICS_PHYSICS_SIMS = [
  "gravity",
  "rutherford-gold-foil",
  "special-relativity",
  "general-relativity",
  "black-holes",
  "wormholes",
  "time-travel",
  "double-slit",
  "quantum-superposition",
  "quantum-entanglement",
  "quantum-tunneling",
  "wave-function-collapse",
] as const;
