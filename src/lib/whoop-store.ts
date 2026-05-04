// Whoop data storage — uses KV abstraction

import { kvGet, kvSet } from "./kv";

// ── Token storage ──

interface WhoopTokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id?: string;
}

export async function saveWhoopTokens(data: WhoopTokenData) {
  await kvSet("whoop:tokens", data);
}

export async function getWhoopTokens(): Promise<WhoopTokenData | null> {
  return kvGet<WhoopTokenData | null>("whoop:tokens", null);
}

export async function isWhoopTokenExpired(): Promise<boolean> {
  const tokens = await getWhoopTokens();
  if (!tokens) return true;
  return Date.now() / 1000 > tokens.expires_at - 60;
}

// ── Recovery data ──

export interface WhoopRecovery {
  cycle_id: string;
  date: string;
  recovery_score: number;
  resting_heart_rate: number;
  hrv_rmssd_milli: number;
  spo2_percentage?: number;
  skin_temp_celsius?: number;
}

export async function saveRecoveries(records: WhoopRecovery[]) {
  const existing = await getRecoveries();
  const map = new Map(existing.map((r) => [r.date, r]));
  for (const rec of records) {
    map.set(rec.date, rec);
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  await kvSet("whoop:recoveries", merged);
}

export async function getRecoveries(): Promise<WhoopRecovery[]> {
  return kvGet<WhoopRecovery[]>("whoop:recoveries", []);
}

// ── Sleep data ──

export interface WhoopSleep {
  id: string;
  date: string;
  start: string;
  end: string;
  score?: {
    stage_summary?: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
    };
    sleep_performance_percentage?: number;
    sleep_efficiency_percentage?: number;
    respiratory_rate?: number;
  };
}

export async function saveSleeps(records: WhoopSleep[]) {
  const existing = await getSleeps();
  const map = new Map(existing.map((s) => [s.id, s]));
  for (const rec of records) {
    map.set(rec.id, rec);
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  await kvSet("whoop:sleeps", merged);
}

export async function getSleeps(): Promise<WhoopSleep[]> {
  return kvGet<WhoopSleep[]>("whoop:sleeps", []);
}

// ── Strain / Cycle data ──

export interface WhoopCycle {
  id: string;
  date: string;
  start: string;
  end: string;
  strain?: number;
  kilojoule?: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
}

export async function saveCycles(records: WhoopCycle[]) {
  const existing = await getCycles();
  const map = new Map(existing.map((c) => [c.id, c]));
  for (const rec of records) {
    map.set(rec.id, rec);
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  await kvSet("whoop:cycles", merged);
}

export async function getCycles(): Promise<WhoopCycle[]> {
  return kvGet<WhoopCycle[]>("whoop:cycles", []);
}
