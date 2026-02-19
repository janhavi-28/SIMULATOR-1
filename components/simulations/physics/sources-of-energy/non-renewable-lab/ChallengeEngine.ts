/**
 * Challenge mode: problem definitions and evaluation. No UI.
 */

import type { ChallengeTarget } from "./types";

export interface ChallengeProblem {
  id: string;
  title: string;
  description: string;
  target: ChallengeTarget;
  /** Duration in seconds for "run for X sec" goals */
  durationSec?: number;
}

export const CHALLENGE_PROBLEMS: ChallengeProblem[] = [
  {
    id: "min-emissions",
    title: "Minimum emissions",
    description: "Produce 5 MW with minimum emissions.",
    target: { targetPowerMW: 5, emissionLimitTonsPerHour: 3 },
  },
  {
    id: "no-overheat",
    title: "No overheating",
    description: "Run the plant without overheating for 20 seconds.",
    target: { runWithoutOverheatSeconds: 20 },
    durationSec: 20,
  },
  {
    id: "max-efficiency",
    title: "Maximum efficiency",
    description: "Reach at least 42% efficiency while producing power.",
    target: { efficiencyGoalPercent: 42 },
  },
  {
    id: "target-power",
    title: "Target power",
    description: "Maintain 8 MW for 10 seconds.",
    target: { targetPowerMW: 8 },
    durationSec: 10,
  },
];

export interface ChallengeEvaluation {
  problemId: string;
  success: boolean;
  message: string;
  scorePercent: number;
  details: Record<string, number | string>;
}

export function evaluateChallenge(
  problem: ChallengeProblem,
  snapshot: {
    powerMW: number;
    co2TonsPerHour: number;
    efficiencyPercent: number;
    isOverheated: boolean;
    elapsedTimeSec: number;
  }
): ChallengeEvaluation {
  const details: Record<string, number | string> = {};
  let success = true;
  let score = 100;
  const t = problem.target;

  if (t.targetPowerMW !== undefined) {
    const diff = Math.abs(snapshot.powerMW - t.targetPowerMW);
    details.powerMW = snapshot.powerMW;
    if (diff > 0.5) {
      success = false;
      score -= Math.min(50, diff * 10);
    }
  }
  if (t.emissionLimitTonsPerHour !== undefined) {
    details.co2TonsPerHour = snapshot.co2TonsPerHour;
    if (snapshot.co2TonsPerHour > t.emissionLimitTonsPerHour) {
      success = false;
      score -= 30;
    }
  }
  if (t.efficiencyGoalPercent !== undefined) {
    details.efficiencyPercent = snapshot.efficiencyPercent;
    if (snapshot.efficiencyPercent < t.efficiencyGoalPercent) {
      success = false;
      score -= 20;
    }
  }
  if (t.runWithoutOverheatSeconds !== undefined) {
    details.overheated = snapshot.isOverheated ? "yes" : "no";
    details.requiredSec = t.runWithoutOverheatSeconds;
    details.elapsedSec = snapshot.elapsedTimeSec;
    if (snapshot.isOverheated && snapshot.elapsedTimeSec < t.runWithoutOverheatSeconds) {
      success = false;
      score = Math.max(0, 50 - snapshot.elapsedTimeSec);
    }
  }

  const scorePercent = Math.max(0, Math.min(100, score));
  const message = success
    ? "Challenge completed!"
    : "Keep trying — adjust fuel, cooling, or maintenance.";

  return {
    problemId: problem.id,
    success,
    message,
    scorePercent,
    details,
  };
}
