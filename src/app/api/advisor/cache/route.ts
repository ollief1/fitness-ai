import { NextRequest, NextResponse } from "next/server";
import { getAllCached, updateNotes } from "@/lib/advisor-cache";

// GET — return all cached advisor content
export async function GET() {
  const cache = await getAllCached();
  return NextResponse.json({ cache });
}

// PUT — update notes for a specific type
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, notes } = body;

    if (!type || !["session", "plan", "analysis"].includes(type)) {
      return NextResponse.json(
        { error: "Valid type (session, plan, analysis) is required" },
        { status: 400 }
      );
    }

    if (typeof notes !== "string") {
      return NextResponse.json(
        { error: "Notes must be a string" },
        { status: 400 }
      );
    }

    const updated = await updateNotes(type, notes);
    if (!updated) {
      return NextResponse.json(
        { error: "No cached content found for this type" },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry: updated });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
