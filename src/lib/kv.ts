// Key-value storage abstraction
// Uses Vercel KV in production, falls back to local JSON files for dev

import { kv } from "@vercel/kv";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const useKV = !!process.env.KV_REST_API_URL;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Map KV keys to existing local filenames for backwards compatibility
const FILE_MAP: Record<string, string> = {
  "strava:tokens": "tokens.json",
  "strava:activities": "activities.json",
  "whoop:tokens": "whoop-tokens.json",
  "whoop:recoveries": "whoop-recovery.json",
  "whoop:sleeps": "whoop-sleep.json",
  "whoop:cycles": "whoop-cycles.json",
  "goals": "goals.json",
  "phase:override": "phase-override.json",
  "garmin:status": "garmin-status.json",
  "garmin:data": "garmin-data.json",
};

function filePathFor(key: string): string {
  const filename = FILE_MAP[key] || key.replace(/:/g, "-") + ".json";
  return path.join(DATA_DIR, filename);
}

export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  if (useKV) {
    try {
      const val = await kv.get<T>(key);
      return val ?? fallback;
    } catch {
      return fallback;
    }
  }

  // Local file fallback
  try {
    const filepath = filePathFor(key);
    if (!fs.existsSync(filepath)) return fallback;
    const raw = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  if (useKV) {
    await kv.set(key, value);
    return;
  }

  // Local file fallback
  ensureDataDir();
  fs.writeFileSync(filePathFor(key), JSON.stringify(value, null, 2));
}

export async function kvDel(key: string): Promise<void> {
  if (useKV) {
    await kv.del(key);
    return;
  }

  // Local file fallback
  const filepath = filePathFor(key);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}
