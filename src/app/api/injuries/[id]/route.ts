import { NextRequest, NextResponse } from "next/server";
import { updateInjury, deleteInjury } from "@/lib/injuries-store";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateInjury(id, body);

    if (!updated) {
      return NextResponse.json({ error: "Injury not found" }, { status: 404 });
    }

    return NextResponse.json({ injury: updated });
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
  const deleted = await deleteInjury(id);

  if (!deleted) {
    return NextResponse.json({ error: "Injury not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
