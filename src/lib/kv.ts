// Key-value storage abstraction
// Uses Vercel KV in production, falls back to local JSON files for dev

const useKV = !!process.env.KV_REST_API_URL;

// ── KV helpers (lazy import to avoid issues when not configured) ──

async function getKV() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

// ── Local file helpers (only used in dev) ──

function getFS() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");
  const DATA_DIR = path.join(process.cwd(), "data");

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
    "injuries": "injuries.json",
    "advisor:cache": "advisor-cache.json",
  };

  return { fs, path, DATA_DIR, FILE_MAP };
}

function filePathFor(key: string): string {
  const { path, DATA_DIR, FILE_MAP } = getFS();
  const filename = FILE_MAP[key] || key.replace(/:/g, "-") + ".json";
  return path.join(DATA_DIR, filename);
}

// ── Public API ──

export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  if (useKV) {
    try {
      const kv = await getKV();
      const val = await kv.get<T>(key);
      return val ?? fallback;
    } catch (err) {
      console.error("KV get error:", key, err);
      return fallback;
    }
  }

  // Local file fallback
  try {
    const { fs } = getFS();
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
    try {
      const kv = await getKV();
      await kv.set(key, value);
    } catch (err) {
      console.error("KV set error:", key, err);
      throw err;
    }
    return;
  }

  // Local file fallback
  const { fs } = getFS();
  const { DATA_DIR } = getFS();
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(filePathFor(key), JSON.stringify(value, null, 2));
}

export async function kvDel(key: string): Promise<void> {
  if (useKV) {
    try {
      const kv = await getKV();
      await kv.del(key);
    } catch (err) {
      console.error("KV del error:", key, err);
    }
    return;
  }

  // Local file fallback
  const { fs } = getFS();
  const filepath = filePathFor(key);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}
