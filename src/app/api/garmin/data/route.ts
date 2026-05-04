import { NextResponse } from "next/server";
import { getGarminStatus, getGarminData } from "@/lib/garmin-store";

export async function GET() {
  const status = await getGarminStatus();

  if (!status.connected) {
    return NextResponse.json({
      connected: false,
      sleep: [],
      daily_summary: [],
      hrv: [],
      activities: [],
      body_composition: [],
    });
  }

  const data = await getGarminData();

  return NextResponse.json({
    connected: true,
    synced: data.synced || status.last_sync,
    ...data,
  });
}
