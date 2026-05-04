// Training phase calculator
// Auto-calculates periodisation phases based on A race dates
// Supports manual override

import { kvGet, kvSet, kvDel } from "./kv";
import { getGoals, RaceGoal } from "./goals-store";

// ── Types ──

export type TrainingPhase =
  | "base"
  | "build"
  | "peak"
  | "taper"
  | "race_week"
  | "recovery"
  | "off_season";

export interface PhaseInfo {
  phase: TrainingPhase;
  label: string;
  description: string;
  weeksToRace: number | null;
  targetRace: RaceGoal | null;
  weekInPhase: number;
  totalWeeksInPhase: number;
  isOverride: boolean;
}

export interface PhaseOverride {
  phase: TrainingPhase;
  reason?: string;
  set_at: string;
}

// ── Phase descriptions ──

const PHASE_DETAILS: Record<TrainingPhase, { label: string; description: string }> = {
  base: {
    label: "Base",
    description: "Building aerobic foundation. Focus on easy volume, technique, and consistency.",
  },
  build: {
    label: "Build",
    description: "Increasing intensity with tempo, threshold, and race-pace sessions. Volume stays steady or slightly drops.",
  },
  peak: {
    label: "Peak",
    description: "Race-specific intensity and simulation. Volume reducing, quality sessions are key.",
  },
  taper: {
    label: "Taper",
    description: "Reducing volume significantly while keeping some intensity. Rest and recover for race day.",
  },
  race_week: {
    label: "Race Week",
    description: "Final preparations. Very light sessions, openers, and rest. Trust your training.",
  },
  recovery: {
    label: "Recovery",
    description: "Post-race recovery period. Easy movement, no structured training. Let your body adapt.",
  },
  off_season: {
    label: "Off Season",
    description: "No target race on the horizon. Good time for general fitness, cross-training, and enjoyment.",
  },
};

// ── Override management ──

export async function getPhaseOverride(): Promise<PhaseOverride | null> {
  return kvGet<PhaseOverride | null>("phase:override", null);
}

export async function setPhaseOverride(phase: TrainingPhase, reason?: string): Promise<PhaseOverride> {
  const override: PhaseOverride = {
    phase,
    reason,
    set_at: new Date().toISOString(),
  };
  await kvSet("phase:override", override);
  return override;
}

export async function clearPhaseOverride(): Promise<void> {
  await kvDel("phase:override");
}

// ── Phase calculation ──

function calculatePhaseFromRace(
  race: RaceGoal,
  today: Date
): { phase: TrainingPhase; weekInPhase: number; totalWeeksInPhase: number } {
  const raceDate = new Date(race.date);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksOut = Math.floor((raceDate.getTime() - today.getTime()) / msPerWeek);

  const dist = race.distance.toLowerCase();
  const isLongCourse =
    dist.includes("ironman") ||
    dist.includes("140.6") ||
    dist.includes("70.3") ||
    dist.includes("half ironman") ||
    (race.distance_km && race.distance_km > 80);

  const isShortCourse =
    dist.includes("sprint") ||
    dist.includes("5k") ||
    dist.includes("10k") ||
    (race.distance_km && race.distance_km < 30);

  let taperStart = 2;
  let peakStart = 4;
  let buildStart = 10;

  if (isLongCourse) {
    taperStart = 3;
    peakStart = 6;
    buildStart = 14;
  } else if (isShortCourse) {
    taperStart = 1;
    peakStart = 3;
    buildStart = 7;
  }

  if (weeksOut < 0) {
    const weeksSinceRace = Math.abs(weeksOut);
    if (weeksSinceRace <= 2) {
      return { phase: "recovery", weekInPhase: weeksSinceRace, totalWeeksInPhase: 2 };
    }
    return { phase: "off_season", weekInPhase: 0, totalWeeksInPhase: 0 };
  }

  if (weeksOut === 0) {
    return { phase: "race_week", weekInPhase: 1, totalWeeksInPhase: 1 };
  }

  if (weeksOut <= taperStart) {
    return {
      phase: "taper",
      weekInPhase: taperStart - weeksOut + 1,
      totalWeeksInPhase: taperStart,
    };
  }

  if (weeksOut <= peakStart) {
    return {
      phase: "peak",
      weekInPhase: peakStart - weeksOut + 1,
      totalWeeksInPhase: peakStart - taperStart,
    };
  }

  if (weeksOut <= buildStart) {
    return {
      phase: "build",
      weekInPhase: buildStart - weeksOut + 1,
      totalWeeksInPhase: buildStart - peakStart,
    };
  }

  return {
    phase: "base",
    weekInPhase: 1,
    totalWeeksInPhase: weeksOut - buildStart,
  };
}

export async function getCurrentPhase(): Promise<PhaseInfo> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check for manual override first
  const override = await getPhaseOverride();
  if (override) {
    const details = PHASE_DETAILS[override.phase];
    return {
      phase: override.phase,
      label: details.label,
      description: details.description + (override.reason ? ` (${override.reason})` : ""),
      weeksToRace: null,
      targetRace: null,
      weekInPhase: 0,
      totalWeeksInPhase: 0,
      isOverride: true,
    };
  }

  // Find the next A race
  const goals = await getGoals();
  const aRaces = goals
    .filter((g) => g.priority === "A")
    .filter((g) => {
      const raceDate = new Date(g.date);
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return raceDate >= twoWeeksAgo;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (aRaces.length === 0) {
    const bRaces = goals
      .filter((g) => g.priority === "B" && new Date(g.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (bRaces.length > 0) {
      const race = bRaces[0];
      const result = calculatePhaseFromRace(race, today);
      const details = PHASE_DETAILS[result.phase];
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weeksToRace = Math.floor(
        (new Date(race.date).getTime() - today.getTime()) / msPerWeek
      );

      return {
        ...result,
        label: details.label,
        description: details.description,
        weeksToRace: Math.max(0, weeksToRace),
        targetRace: race,
        isOverride: false,
      };
    }

    const details = PHASE_DETAILS.off_season;
    return {
      phase: "off_season",
      label: details.label,
      description: details.description,
      weeksToRace: null,
      targetRace: null,
      weekInPhase: 0,
      totalWeeksInPhase: 0,
      isOverride: false,
    };
  }

  const targetRace = aRaces[0];
  const result = calculatePhaseFromRace(targetRace, today);
  const details = PHASE_DETAILS[result.phase];
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksToRace = Math.floor(
    (new Date(targetRace.date).getTime() - today.getTime()) / msPerWeek
  );

  return {
    ...result,
    label: details.label,
    description: details.description,
    weeksToRace: Math.max(0, weeksToRace),
    targetRace,
    isOverride: false,
  };
}
