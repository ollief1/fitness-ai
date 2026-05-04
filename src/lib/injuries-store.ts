// Active injuries store — KV-backed

import crypto from "crypto";
import { kvGet, kvSet } from "./kv";

// ── Types ──

export type Severity = "minor" | "moderate" | "severe";

export interface Injury {
  id: string;
  name: string;                     // e.g. "Left knee pain", "Shoulder impingement"
  area: string;                     // e.g. "knee", "shoulder", "ankle", "back"
  severity: Severity;
  avoid_disciplines: string[];      // e.g. ["run"], ["swim", "run"], []
  avoid_activities: string[];       // e.g. ["intervals", "hills"], ["butterfly"]
  notes?: string;                   // free text for context
  created_at: string;
}

// ── CRUD ──

export async function getInjuries(): Promise<Injury[]> {
  return kvGet<Injury[]>("injuries", []);
}

async function saveInjuries(injuries: Injury[]) {
  await kvSet("injuries", injuries);
}

export async function addInjury(
  injury: Omit<Injury, "id" | "created_at">
): Promise<Injury> {
  const injuries = await getInjuries();
  const newInjury: Injury = {
    ...injury,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  injuries.push(newInjury);
  await saveInjuries(injuries);
  return newInjury;
}

export async function updateInjury(
  id: string,
  updates: Partial<Omit<Injury, "id" | "created_at">>
): Promise<Injury | null> {
  const injuries = await getInjuries();
  const index = injuries.findIndex((i) => i.id === id);
  if (index === -1) return null;

  injuries[index] = { ...injuries[index], ...updates };
  await saveInjuries(injuries);
  return injuries[index];
}

export async function deleteInjury(id: string): Promise<boolean> {
  const injuries = await getInjuries();
  const filtered = injuries.filter((i) => i.id !== id);
  if (filtered.length === injuries.length) return false;
  await saveInjuries(filtered);
  return true;
}
