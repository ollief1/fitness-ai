// Garmin data store — reads from KV or local JSON files
// Note: Garmin sync requires the Python script which only runs locally

import { kvGet } from "./kv";

// ── Types ──

export interface GarminSleep {
  date: string;
  start?: number;
  end?: number;
  total_sleep_seconds: number;
  deep_sleep_seconds: number;
  light_sleep_seconds: number;
  rem_sleep_seconds: number;
  awake_seconds: number;
  avg_spo2?: number;
  avg_respiration?: number;
  avg_stress?: number;
  score?: number;
  quality?: string;
}

export interface GarminDailySummary {
  date: string;
  avg_stress?: number;
  max_stress?: number;
  body_battery_high?: number;
  body_battery_low?: number;
  steps?: number;
  resting_hr?: number;
  min_hr?: number;
  max_hr?: number;
  avg_hr?: number;
  floors_ascended?: number;
  active_seconds?: number;
  calories_total?: number;
  calories_active?: number;
}

export interface GarminHRV {
  date: string;
  weekly_avg?: number;
  last_night?: number;
  last_night_avg?: number;
  last_night_5min_high?: number;
  baseline_low?: number;
  baseline_high?: number;
  status?: string;
}

export interface GarminActivity {
  id?: number;
  name: string;
  type: string;
  sport: string;
  start_time: string;
  duration_seconds?: number;
  distance_meters?: number;
  avg_hr?: number;
  max_hr?: number;
  calories?: number;
  avg_speed?: number;
  max_speed?: number;
  elevation_gain?: number;
  avg_cadence?: number;
  training_effect_aerobic?: number;
  training_effect_anaerobic?: number;
  training_load?: number;
  vo2_max?: number;
}

export interface GarminBodyComposition {
  date: string;
  weight_kg?: number;
  bmi?: number;
  body_fat_pct?: number;
  muscle_mass_kg?: number;
}

export interface GarminData {
  synced?: string;
  sleep: GarminSleep[];
  daily_summary: GarminDailySummary[];
  hrv: GarminHRV[];
  activities: GarminActivity[];
  body_composition: GarminBodyComposition[];
}

export interface GarminStatus {
  connected: boolean;
  email?: string;
  last_auth?: string;
  last_sync?: string;
  error?: string;
  record_counts?: {
    sleep: number;
    daily_summary: number;
    hrv: number;
    activities: number;
    body_composition: number;
  };
}

// ── Read functions ──

export async function getGarminStatus(): Promise<GarminStatus> {
  return kvGet<GarminStatus>("garmin:status", { connected: false });
}

export async function getGarminData(): Promise<GarminData> {
  return kvGet<GarminData>("garmin:data", {
    sleep: [],
    daily_summary: [],
    hrv: [],
    activities: [],
    body_composition: [],
  });
}

export async function getGarminSleep(): Promise<GarminSleep[]> {
  const data = await getGarminData();
  return data.sleep;
}

export async function getGarminDailySummary(): Promise<GarminDailySummary[]> {
  const data = await getGarminData();
  return data.daily_summary;
}

export async function getGarminHRV(): Promise<GarminHRV[]> {
  const data = await getGarminData();
  return data.hrv;
}

export async function getGarminActivities(): Promise<GarminActivity[]> {
  const data = await getGarminData();
  return data.activities;
}

export async function getGarminBodyComposition(): Promise<GarminBodyComposition[]> {
  const data = await getGarminData();
  return data.body_composition;
}
