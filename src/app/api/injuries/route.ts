import { NextRequest, NextResponse } from "next/server";
import { getInjuries, addInjury } from "@/lib/injuries-store";

export async function GET() {
  const injuries = await getInjuries();
  return NextResponse.json({ injuries });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.area || !body.severity) {
      return NextResponse.json(
        { error: "Name, area, and severity are required" },
        { status: 400 }
      );
    }

    const injury = await addInjury({
      name: body.name,
      area: body.area,
      severity: body.severity,
      avoid_disciplines: body.avoid_disciplines || [],
      avoid_activities: body.avoid_activities || [],
      notes: body.notes,
    });

    return NextResponse.json({ injury }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
