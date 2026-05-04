// Race goals storage — uses KV abstraction

import crypto from "crypto";
import { kvGet, kvSet } from "./kv";

// ── Types ──

export type Discipline = "swim" | "bike" | "run" | "triathlon" | "duathlon" | "other";
export type Priority = "A" | "B" | "C";
export type RegistrationStatus = "registered" | "planned" | "considering";

export interface RaceGoal {
  id: string;
  name: string;
  date: string;
  discipline: Discipline;
  distance: string;
  distance_km?: number;
  target_time?: string;
  priority: Priority;
  location?: string;
  registration_status: RegistrationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ── CRUD ──

export async function getGoals(): Promise<RaceGoal[]> {
  return kvGet<RaceGoal[]>("goals", []);
}

async function saveGoals(goals: RaceGoal[]) {
  const sorted = goals.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  await kvSet("goals", sorted);
}

export async function addGoal(
  goal: Omit<RaceGoal, "id" | "created_at" | "updated_at">
): Promise<RaceGoal> {
  const goals = await getGoals();
  const now = new Date().toISOString();
  const newGoal: RaceGoal = {
    ...goal,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
  goals.push(newGoal);
  await saveGoals(goals);
  return newGoal;
}

export async function updateGoal(
  id: string,
  updates: Partial<Omit<RaceGoal, "id" | "created_at">>
): Promise<RaceGoal | null> {
  const goals = await getGoals();
  const index = goals.findIndex((g) => g.id === id);
  if (index === -1) return null;

  goals[index] = {
    ...goals[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  await saveGoals(goals);
  return goals[index];
}

export async function deleteGoal(id: string): Promise<boolean> {
  const goals = await getGoals();
  const filtered = goals.filter((g) => g.id !== id);
  if (filtered.length === goals.length) return false;
  await saveGoals(filtered);
  return true;
}

export async function getUpcomingGoals(): Promise<RaceGoal[]> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const goals = await getGoals();
  return goals.filter((g) => new Date(g.date) >= now);
}

export async function getPastGoals(): Promise<RaceGoal[]> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const goals = await getGoals();
  return goals.filter((g) => new Date(g.date) < now);
}
