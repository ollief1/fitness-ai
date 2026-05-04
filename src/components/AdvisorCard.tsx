"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PhaseInfo {
  phase: string;
  label: string;
  description: string;
  weeksToRace: number | null;
  targetRace: string | null;
  isOverride: boolean;
}

function phaseColor(phase: string): string {
  switch (phase) {
    case "base": return "bg-blue-100 text-blue-700";
    case "build": return "bg-amber-100 text-amber-700";
    case "peak": return "bg-red-100 text-red-700";
    case "taper": return "bg-green-100 text-green-700";
    case "race_week": return "bg-purple-100 text-purple-700";
    case "recovery": return "bg-indigo-100 text-indigo-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

export default function AdvisorCard() {
  const [insight, setInsight] = useState<string | null>(null);
  const [phase, setPhase] = useState<PhaseInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadInsight() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/advisor");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setInsight(data.insight);
        setPhase(data.phase);
      }
    } catch {
      setError("Failed to load advisor insight");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-gray-700">AI Coach</h2>
          {phase && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${phaseColor(phase.phase)}`}>
              {phase.label}
              {phase.weeksToRace != null && ` · ${phase.weeksToRace}w to race`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/advisor"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Full analysis
          </Link>
          {!loading && (
            <button
              onClick={loadInsight}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {insight ? "Refresh" : "Get advice"}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs text-gray-400">Analysing your training...</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 py-2">{error}</p>
      )}

      {insight && !loading && (
        <div className="text-sm text-gray-600 leading-relaxed space-y-2">
          {insight.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}

      {!insight && !loading && !error && (
        <p className="text-xs text-gray-400 py-2">
          Click &quot;Get advice&quot; for a personalised daily training insight based on your data.
        </p>
      )}
    </div>
  );
}
