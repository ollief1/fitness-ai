import { NextResponse } from "next/server";
import {
  getActivities as fetchStravaActivities,
  refreshAccessToken,
} from "@/lib/strava";
import {
  getTokens,
  isTokenExpired,
  saveTokens,
  saveActivities,
  getActivities as getStoredActivities,
  StoredActivity,
} from "@/lib/store";

export async function GET() {
  let tokens = await getTokens();

  if (!tokens) {
    return NextResponse.json(
      { error: "Not authenticated", activities: [] },
      { status: 401 }
    );
  }

  // Refresh token if expired
  if (await isTokenExpired()) {
    try {
      const refreshed = await refreshAccessToken(tokens.refresh_token);
      await saveTokens({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: refreshed.expires_at,
        athlete: tokens.athlete,
      });
      tokens = { ...tokens, access_token: refreshed.access_token };
    } catch (err) {
      console.error("Token refresh failed:", err);
      return NextResponse.json(
        { error: "Token refresh failed", activities: [] },
        { status: 401 }
      );
    }
  }

  try {
    // Fetch latest activities from Strava (first 100)
    const page1 = await fetchStravaActivities(tokens.access_token, 1, 50);
    const page2 = await fetchStravaActivities(tokens.access_token, 2, 50);
    const allRaw = [...page1, ...page2];

    // Map to our format
    const activities: StoredActivity[] = allRaw.map((a: Record<string, unknown>) => ({
      id: a.id as number,
      name: a.name as string,
      type: a.type as string,
      sport_type: (a.sport_type as string) || (a.type as string),
      start_date: a.start_date as string,
      start_date_local: a.start_date_local as string,
      distance: a.distance as number,
      moving_time: a.moving_time as number,
      elapsed_time: a.elapsed_time as number,
      total_elevation_gain: a.total_elevation_gain as number,
      average_speed: a.average_speed as number,
      max_speed: a.max_speed as number,
      average_heartrate: a.average_heartrate as number | undefined,
      max_heartrate: a.max_heartrate as number | undefined,
      suffer_score: a.suffer_score as number | undefined,
      average_cadence: a.average_cadence as number | undefined,
      average_watts: a.average_watts as number | undefined,
      kilojoules: a.kilojoules as number | undefined,
      has_heartrate: a.has_heartrate as boolean,
    }));

    // Save to store
    await saveActivities(activities);

    return NextResponse.json({
      activities,
      athlete: tokens.athlete,
      synced: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to fetch activities:", err);

    // Fall back to cached data
    const cached = await getStoredActivities();
    return NextResponse.json({
      activities: cached,
      athlete: tokens.athlete,
      cached: true,
    });
  }
}
