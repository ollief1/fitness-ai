import { NextRequest, NextResponse } from "next/server";
import { getGoals, addGoal } from "@/lib/goals-store";

export async function GET() {
  const goals = await getGoals();
  return NextResponse.json({ goals });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.date || !body.discipline || !body.distance) {
      return NextResponse.json(
        { error: "Name, date, discipline, and distance are required" },
        { status: 400 }
      );
    }

    const goal = await addGoal({
      name: body.name,
      date: body.date,
      discipline: body.discipline,
      distance: body.distance,
      distance_km: body.distance_km,
      target_time: body.target_time,
      priority: body.priority || "B",
      location: body.location,
      registration_status: body.registration_status || "planned",
      notes: body.notes,
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
