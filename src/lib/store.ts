// Strava data storage — uses KV abstraction (Vercel KV in prod, local files in dev)

import { kvGet, kvSet, kvDel } from "./kv";

// ── Token storage ──

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
  };
}

export async function saveTokens(data: TokenData) {
  await kvSet("strava:tokens", data);
}

export async function getTokens(): Promise<TokenData | null> {
  return kvGet<TokenData | null>("strava:tokens", null);
}

export async function isTokenExpired(): Promise<boolean> {
  const tokens = await getTokens();
  if (!tokens) return true;
  return Date.now() / 1000 > tokens.expires_at - 60;
}

export async function clearTokens() {
  await kvDel("strava:tokens");
}

// ── Activity storage ──

export interface StoredActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  suffer_score?: number;
  average_cadence?: number;
  average_watts?: number;
  kilojoules?: number;
  has_heartrate: boolean;
}

export async function saveActivities(activities: StoredActivity[]) {
  const existing = await getActivities();
  const map = new Map(existing.map((a) => [a.id, a]));
  for (const act of activities) {
    map.set(act.id, act);
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );
  await kvSet("strava:activities", merged);
}

export async function getActivities(): Promise<StoredActivity[]> {
  return kvGet<StoredActivity[]>("strava:activities", []);
}
