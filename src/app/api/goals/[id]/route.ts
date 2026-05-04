import { NextRequest, NextResponse } from "next/server";
import { updateGoal, deleteGoal } from "@/lib/goals-store";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateGoal(id, body);

    if (!updated) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ goal: updated });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteGoal(id);

  if (!deleted) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
