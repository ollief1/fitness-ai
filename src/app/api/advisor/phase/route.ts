import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentPhase,
  setPhaseOverride,
  clearPhaseOverride,
  TrainingPhase,
} from "@/lib/training-phases";

export async function GET() {
  const phase = await getCurrentPhase();
  return NextResponse.json({
    phase: {
      ...phase,
      targetRace: phase.targetRace?.name || null,
    },
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phase, reason } = body;

    const validPhases: TrainingPhase[] = [
      "base", "build", "peak", "taper", "race_week", "recovery", "off_season",
    ];

    if (!validPhases.includes(phase)) {
      return NextResponse.json(
        { error: `Invalid phase. Must be one of: ${validPhases.join(", ")}` },
        { status: 400 }
      );
    }

    await setPhaseOverride(phase, reason);
    const updated = await getCurrentPhase();
    return NextResponse.json({
      phase: {
        ...updated,
        targetRace: updated.targetRace?.name || null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  await clearPhaseOverride();
  const updated = await getCurrentPhase();
  return NextResponse.json({
    phase: {
      ...updated,
      targetRace: updated.targetRace?.name || null,
    },
  });
}
