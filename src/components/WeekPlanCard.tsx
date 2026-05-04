"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function disciplineIcon(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("swim")) return "\u{1F3CA}";
  if (lower.includes("bike") || lower.includes("ride") || lower.includes("cycle")) return "\u{1F6B4}";
  if (lower.includes("run")) return "\u{1F3C3}";
  if (lower.includes("rest")) return "\u{1F634}";
  if (lower.includes("strength") || lower.includes("gym")) return "\u{1F3CB}️";
  return "\u{1F3C3}";
}

interface DaySummary {
  day: string;
  discipline: string;
  session: string;
  duration: string;
  intensity: string;
}

function parsePlanToDays(planText: string): DaySummary[] {
  const days: DaySummary[] = [];
  const sections = planText.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.split("\n");
    const dayName = lines[0]?.trim();
    if (!dayName) continue;

    const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    if (!dayNames.some((d) => dayName.toLowerCase().startsWith(d))) continue;

    let discipline = "";
    let sessionTitle = "";
    let duration = "";
    let intensity = "";

    for (const line of lines) {
      const l = line.trim();
      if (l.startsWith("**Discipline") || l.startsWith("**discipline")) {
        discipline = l.replace(/\*\*/g, "").replace(/^discipline:?\s*/i, "").trim();
      } else if (l.startsWith("**Session") || l.startsWith("**session")) {
        sessionTitle = l.replace(/\*\*/g, "").replace(/^session:?\s*/i, "").trim();
      } else if (l.startsWith("**Duration") || l.startsWith("**duration")) {
        duration = l.replace(/\*\*/g, "").replace(/^duration:?\s*/i, "").trim();
      } else if (l.startsWith("**Intensity") || l.startsWith("**intensity")) {
        intensity = l.replace(/\*\*/g, "").replace(/^intensity:?\s*/i, "").trim();
      }
    }

    if (dayName) {
      days.push({
        day: dayName,
        discipline: discipline || "—",
        session: sessionTitle || "—",
        duration: duration || "—",
        intensity: intensity || "—",
      });
    }
  }

  return days;
}

function intensityDot(intensity: string): string {
  const lower = intensity.toLowerCase();
  if (lower === "hard") return "bg-red-400";
  if (lower === "moderate") return "bg-amber-400";
  if (lower === "easy" || lower === "recovery") return "bg-green-400";
  return "bg-gray-300";
}

export default function WeekPlanCard() {
  const [plan, setPlan] = useState<string | null>(null);
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Load cached plan on mount
  useEffect(() => {
    async function loadCache() {
      try {
        const res = await fetch("/api/advisor/cache");
        const data = await res.json();
        if (data.cache?.plan?.content) {
          setPlan(data.cache.plan.content);
          setDays(parsePlanToDays(data.cache.plan.content));
        }
      } catch {
        // fine
      } finally {
        setCacheLoaded(true);
      }
    }
    loadCache();
  }, []);

  async function generatePlan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "plan" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPlan(data.plan);
        setDays(parsePlanToDays(data.plan));
      }
    } catch {
      setError("Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Monday

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Weekly Plan</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/advisor"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Full plan
          </Link>
          {!loading && cacheLoaded && (
            <button
              onClick={generatePlan}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {plan ? "Refresh" : "Generate"}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs text-gray-400">Building your weekly plan...</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 py-2">{error}</p>
      )}

      {days.length > 0 && !loading && (
        <div className="space-y-1.5">
          {days.map((day, i) => (
            <div
              key={day.day}
              className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded ${
                i === todayIndex ? "bg-blue-50 border border-blue-100" : ""
              }`}
            >
              <span className="w-[18px] text-center">{disciplineIcon(day.discipline)}</span>
              <span className={`w-12 font-medium ${i === todayIndex ? "text-blue-700" : "text-gray-500"}`}>
                {day.day.slice(0, 3)}
              </span>
              <span className="flex-1 text-gray-700 truncate">{day.session}</span>
              <span className="text-gray-400 flex-shrink-0">{day.duration}</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${intensityDot(day.intensity)}`} />
            </div>
          ))}
        </div>
      )}

      {!plan && !loading && !error && cacheLoaded && (
        <p className="text-xs text-gray-400 py-2">
          Click &quot;Generate&quot; for a structured 7-day training plan.
        </p>
      )}
    </div>
  );
}
