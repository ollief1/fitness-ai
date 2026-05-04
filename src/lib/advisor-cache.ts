// Advisor cache — persists generated plans, sessions, and analysis in KV

import { kvGet, kvSet } from "./kv";

export interface CachedAdvisorContent {
  content: string;          // AI-generated markdown
  notes: string;            // user's own notes
  generated_at: string;     // ISO timestamp
  type: "session" | "plan" | "analysis";
}

const CACHE_KEY = "advisor:cache";

async function getCache(): Promise<Record<string, CachedAdvisorContent>> {
  return kvGet<Record<string, CachedAdvisorContent>>(CACHE_KEY, {});
}

async function saveCache(cache: Record<string, CachedAdvisorContent>) {
  await kvSet(CACHE_KEY, cache);
}

export async function getCachedContent(
  type: "session" | "plan" | "analysis"
): Promise<CachedAdvisorContent | null> {
  const cache = await getCache();
  return cache[type] || null;
}

export async function setCachedContent(
  type: "session" | "plan" | "analysis",
  content: string
): Promise<CachedAdvisorContent> {
  const cache = await getCache();
  const entry: CachedAdvisorContent = {
    content,
    notes: cache[type]?.notes || "",  // preserve existing notes on regenerate
    generated_at: new Date().toISOString(),
    type,
  };
  cache[type] = entry;
  await saveCache(cache);
  return entry;
}

export async function updateNotes(
  type: "session" | "plan" | "analysis",
  notes: string
): Promise<CachedAdvisorContent | null> {
  const cache = await getCache();
  if (!cache[type]) return null;
  cache[type].notes = notes;
  await saveCache(cache);
  return cache[type];
}

export async function getAllCached(): Promise<Record<string, CachedAdvisorContent>> {
  return getCache();
}
