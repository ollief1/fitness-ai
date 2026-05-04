import { NextResponse } from "next/server";
import {
  getRecoveries as fetchRecoveries,
  getSleeps as fetchSleeps,
  getCycles as fetchCycles,
  refreshWhoopToken,
} from "@/lib/whoop";
import {
  getWhoopTokens,
  isWhoopTokenExpired,
  saveWhoopTokens,
  saveRecoveries,
  saveSleeps,
  saveCycles,
  getRecoveries,
  getSleeps,
  getCycles,
  WhoopRecovery,
  WhoopSleep,
  WhoopCycle,
} from "@/lib/whoop-store";

export async function GET() {
  let tokens = await getWhoopTokens();

  if (!tokens) {
    return NextResponse.json({
      connected: false,
      recoveries: [],
      sleeps: [],
      cycles: [],
    });
  }

  // Refresh token if expired
  if (await isWhoopTokenExpired()) {
    try {
      const refreshed = await refreshWhoopToken(tokens.refresh_token);
      const expiresAt = Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600);
      await saveWhoopTokens({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: expiresAt,
        user_id: tokens.user_id,
      });
      tokens = { ...tokens, access_token: refreshed.access_token };
    } catch (err) {
      console.error("Whoop token refresh failed:", err);
      return NextResponse.json({
        connected: true,
        recoveries: await getRecoveries(),
        sleeps: await getSleeps(),
        cycles: await getCycles(),
        cached: true,
      });
    }
  }

  try {
    const [recoveryData, sleepData, cycleData] = await Promise.all([
      fetchRecoveries(tokens.access_token).catch(() => ({ records: [] })),
      fetchSleeps(tokens.access_token).catch(() => ({ records: [] })),
      fetchCycles(tokens.access_token).catch(() => ({ records: [] })),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recoveries: WhoopRecovery[] = (recoveryData.records || []).map((r: any) => ({
      cycle_id: r.cycle_id?.toString() || "",
      date: r.created_at || r.updated_at || "",
      recovery_score: r.score?.recovery_score ?? 0,
      resting_heart_rate: r.score?.resting_heart_rate ?? 0,
      hrv_rmssd_milli: r.score?.hrv_rmssd_milli ?? 0,
      spo2_percentage: r.score?.spo2_percentage,
      skin_temp_celsius: r.score?.skin_temp_celsius,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sleeps: WhoopSleep[] = (sleepData.records || []).map((s: any) => ({
      id: s.id?.toString() || "",
      date: s.created_at || s.start || "",
      start: s.start || "",
      end: s.end || "",
      score: s.score
        ? {
            stage_summary: s.score.stage_summary,
            sleep_performance_percentage: s.score.sleep_performance_percentage,
            sleep_efficiency_percentage: s.score.sleep_efficiency_percentage,
            respiratory_rate: s.score.respiratory_rate,
          }
        : undefined,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cycles: WhoopCycle[] = (cycleData.records || []).map((c: any) => ({
      id: c.id?.toString() || "",
      date: c.created_at || c.start || "",
      start: c.start || "",
      end: c.end || "",
      strain: c.score?.strain,
      kilojoule: c.score?.kilojoule,
      average_heart_rate: c.score?.average_heart_rate,
      max_heart_rate: c.score?.max_heart_rate,
    }));

    if (recoveries.length > 0) await saveRecoveries(recoveries);
    if (sleeps.length > 0) await saveSleeps(sleeps);
    if (cycles.length > 0) await saveCycles(cycles);

    return NextResponse.json({
      connected: true,
      recoveries,
      sleeps,
      cycles,
      synced: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to fetch Whoop data:", err);
    return NextResponse.json({
      connected: true,
      recoveries: await getRecoveries(),
      sleeps: await getSleeps(),
      cycles: await getCycles(),
      cached: true,
    });
  }
}
