"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RaceGoal {
  id: string;
  name: string;
  date: string;
  discipline: string;
  distance: string;
  distance_km?: number;
  target_time?: string;
  priority: "A" | "B" | "C";
  location?: string;
  registration_status: "registered" | "planned" | "considering";
  notes?: string;
}

const DISCIPLINES = [
  { value: "triathlon", label: "Triathlon" },
  { value: "swim", label: "Swim" },
  { value: "bike", label: "Bike" },
  { value: "run", label: "Run" },
  { value: "duathlon", label: "Duathlon" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "A", label: "A Race", desc: "Key goal race" },
  { value: "B", label: "B Race", desc: "Important but not primary" },
  { value: "C", label: "C Race", desc: "Training race / fun" },
];

const REG_STATUSES = [
  { value: "registered", label: "Registered" },
  { value: "planned", label: "Planned" },
  { value: "considering", label: "Considering" },
];

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function weeksUntil(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days} days`;
  const weeks = Math.floor(days / 7);
  const remaining = days % 7;
  if (remaining === 0) return `${weeks}w`;
  return `${weeks}w ${remaining}d`;
}

function priorityColor(p: string): string {
  if (p === "A") return "bg-red-100 text-red-700";
  if (p === "B") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-500";
}

function regStatusColor(s: string): string {
  if (s === "registered") return "bg-green-100 text-green-700";
  if (s === "planned") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-500";
}

const emptyForm = {
  name: "",
  date: "",
  discipline: "triathlon",
  distance: "",
  distance_km: "",
  target_time: "",
  priority: "B",
  location: "",
  registration_status: "planned",
  notes: "",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<RaceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function loadGoals() {
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      setGoals(data.goals || []);
    } catch (err) {
      console.error("Failed to load goals:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(goal: RaceGoal) {
    setForm({
      name: goal.name,
      date: goal.date,
      discipline: goal.discipline,
      distance: goal.distance,
      distance_km: goal.distance_km?.toString() || "",
      target_time: goal.target_time || "",
      priority: goal.priority,
      location: goal.location || "",
      registration_status: goal.registration_status,
      notes: goal.notes || "",
    });
    setEditingId(goal.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name,
      date: form.date,
      discipline: form.discipline,
      distance: form.distance,
      distance_km: form.distance_km ? parseFloat(form.distance_km) : undefined,
      target_time: form.target_time || undefined,
      priority: form.priority,
      location: form.location || undefined,
      registration_status: form.registration_status,
      notes: form.notes || undefined,
    };

    if (editingId) {
      await fetch(`/api/goals/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowForm(false);
    setEditingId(null);
    loadGoals();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    loadGoals();
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = goals.filter((g) => new Date(g.date) >= now);
  const past = goals.filter((g) => new Date(g.date) < now);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Race Goals</h1>
          <p className="text-sm text-gray-500 mt-1">
            {upcoming.length} upcoming {upcoming.length === 1 ? "race" : "races"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddForm}
            className="text-xs text-white bg-gray-900 hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors"
          >
            Add Race
          </button>
          <Link
            href="/dashboard"
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editingId ? "Edit Race" : "Add Race"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Name + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Race Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ironman 70.3 Staffordshire"
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 2: Discipline + Distance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Discipline *
                </label>
                <select
                  value={form.discipline}
                  onChange={(e) =>
                    setForm({ ...form, discipline: e.target.value })
                  }
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {DISCIPLINES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Distance *
                </label>
                <input
                  type="text"
                  required
                  value={form.distance}
                  onChange={(e) =>
                    setForm({ ...form, distance: e.target.value })
                  }
                  placeholder="e.g. Olympic, 70.3, Marathon, 10km"
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 3: Priority + Registration + Target Time */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} — {p.desc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Registration
                </label>
                <select
                  value={form.registration_status}
                  onChange={(e) =>
                    setForm({ ...form, registration_status: e.target.value })
                  }
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {REG_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Target Time
                </label>
                <input
                  type="text"
                  value={form.target_time}
                  onChange={(e) =>
                    setForm({ ...form, target_time: e.target.value })
                  }
                  placeholder="e.g. 5:30:00"
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 4: Location + Distance (km) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Staffordshire, UK"
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.distance_km}
                  onChange={(e) =>
                    setForm({ ...form, distance_km: e.target.value })
                  }
                  placeholder="Total distance in km"
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="text-xs text-white bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                {editingId ? "Save Changes" : "Add Race"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming races */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Upcoming
          </h2>
          <div className="space-y-2">
            {upcoming.map((goal) => (
              <div
                key={goal.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {goal.name}
                      </h3>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityColor(
                          goal.priority
                        )}`}
                      >
                        {goal.priority}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${regStatusColor(
                          goal.registration_status
                        )}`}
                      >
                        {goal.registration_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        {new Date(goal.date).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="capitalize">{goal.discipline}</span>
                      <span>{goal.distance}</span>
                      {goal.location && <span>{goal.location}</span>}
                      {goal.target_time && (
                        <span>Target: {goal.target_time}</span>
                      )}
                    </div>
                    {goal.notes && (
                      <p className="text-xs text-gray-400 mt-1">{goal.notes}</p>
                    )}
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">
                      {weeksUntil(goal.date)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => openEditForm(goal)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Edit
                      </button>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past races */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Past
          </h2>
          <div className="space-y-2 opacity-60">
            {past.map((goal) => (
              <div
                key={goal.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {goal.name}
                      </h3>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityColor(
                          goal.priority
                        )}`}
                      >
                        {goal.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        {new Date(goal.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="capitalize">{goal.discipline}</span>
                      <span>{goal.distance}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-3">No races added yet</p>
          <button
            onClick={openAddForm}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first race
          </button>
        </div>
      )}
    </div>
  );
}
