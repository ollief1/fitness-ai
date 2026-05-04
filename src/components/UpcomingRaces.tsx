"use client";

import Link from "next/link";

interface RaceGoal {
  id: string;
  name: string;
  date: string;
  discipline: string;
  distance: string;
  priority: "A" | "B" | "C";
  target_time?: string;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function countdownText(dateStr: string): string {
  const days = daysUntil(dateStr);
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

export default function UpcomingRaces({ goals }: { goals: RaceGoal[] }) {
  // Filter to upcoming only and take first 3
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = goals
    .filter((g) => new Date(g.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Upcoming Races</h2>
        <Link
          href="/goals"
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {upcoming.map((goal) => (
          <div key={goal.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityColor(
                  goal.priority
                )}`}
              >
                {goal.priority}
              </span>
              <div>
                <p className="text-sm text-gray-900">{goal.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(goal.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  · {goal.distance}
                  {goal.target_time ? ` · ${goal.target_time}` : ""}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
              {countdownText(goal.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
