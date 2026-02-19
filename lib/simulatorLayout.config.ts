/**
 * Global Simulator Layout System — High School Physics
 * Single source of truth for proportions, heights, and breakpoints.
 * Matches professional edtech standards (PhET, Labster, Brilliant).
 */

export const SIMULATOR_LAYOUT_CONFIG = {
  /** Max width of the simulator container (prevents cramped layout on large screens) */
  maxWidth: 1600,

  /** Responsive padding: clamp(16px, 3vw, 32px) */
  paddingInline: "clamp(16px, 3vw, 32px)",

  /** Grid: 1.4fr canvas, 0.6fr controls — industry edtech ratio */
  grid: {
    columns: "1.4fr 0.6fr",
    gap: 24,
  },

  /** Canvas min-heights — never use fixed 400px/450px */
  minHeight: {
    base: 650,
    lg: 720,
    xl: 780,
  },

  /** Breakpoint below which layout stacks vertically (simulator full width, controls below) */
  stackBelowWidth: 1280,

  /** Panel card styling */
  panel: {
    borderRadius: 18,
    padding: 20,
    background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
  },

  /** Header bar */
  header: {
    marginBottom: 16,
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
} as const;

export type SimulatorLayoutConfig = typeof SIMULATOR_LAYOUT_CONFIG;
