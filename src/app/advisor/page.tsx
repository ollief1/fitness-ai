"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PhaseInfo {
  phase: string;
  label: string;
  description: string;
  weeksToRace: number | null;
  targetRace: string | null;
  weekInPhase: number;
  totalWeeksInPhase: number;
  isOverride: boolean;
}

const PHASES = [
  { value: "base", label: "Base" },
  { value: "build", label: "Build" },
  { value: "peak", label: "Peak" },
  { value: "taper", label: "Taper" },
  { value: "race_week", label: "Race Week" },
  { value: "recovery", label: "Recovery" },
  { value: "off_season", label: "Off Season" },
];

function phaseColor(phase: string): string {
  switch (phase) {
    case "base": return "bg-blue-100 text-blue-700 border-blue-200";
    case "build": return "bg-amber-100 text-amber-700 border-amber-200";
    case "peak": return "bg-red-100 text-red-700 border-red-200";
    case "taper": return "bg-green-100 text-green-700 border-green-200";
    case "race_week": return "bg-purple-100 text-purple-700 border-purple-200";
    case "recovery": return "bg-indigo-100 text-indigo-700 border-indigo-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    // ## Headers
    if (line.startsWith("## ") || line.startsWith("### ")) {
      return (
        <h3 key={i} className="text-sm font-semibold text-gray-800 mt-5 mb-1">
          {line.replace(/^#{2,3}\s/, "")}
        </h3>
      );
    }
    // **Bold headers**
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <h3 key={i} className="text-sm font-semibold text-gray-800 mt-5 mb-1">
          {line.replace(/\*\*/g, "")}
        </h3>
      );
    }
    // Lines with **bold** inline
    if (line.includes("**")) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="mb-1">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="font-semibold text-gray-800">
                {part.replace(/\*\*/g, "")}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    return <p key={i} className="mb-1">{line}</p>;
  });
}

type ActiveTab = "session" | "plan" | "analysis";

export default function AdvisorPage() {
  const [phase, setPhase] = useState<PhaseInfo | null>(null);
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [showOverride, setShowOverride] = useState(false);
  const [overridePhase, setOverridePhase] = useState("base");
  const [overrideReason, setOverrideReason] = useState("");

  const [activeTab, setActiveTab] = useState<ActiveTab>("session");

  // Session state
  const [session, setSession] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Plan state
  const [plan, setPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Analysis state
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  async function loadPhase() {
    try {
      const res = await fetch("/api/advisor/phase");
      const data = await res.json();
      setPhase(data.phase);
    } catch {
      // ignore
    } finally {
      setPhaseLoading(false);
    }
  }

  useEffect(() => {
    loadPhase();
  }, []);

  async function generateSession() {
    setSessionLoading(true);
    setSessionError(null);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "session" }),
      });
      const data = await res.json();
      if (data.error) {
        setSessionError(data.error);
      } else {
        setSession(data.session);
      }
    } catch {
      setSessionError("Failed to generate session");
    } finally {
      setSessionLoading(false);
    }
  }

  async function generatePlan() {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "plan" }),
      });
      const data = await res.json();
      if (data.error) {
        setPlanError(data.error);
      } else {
        setPlan(data.plan);
      }
    } catch {
      setPlanError("Failed to generate plan");
    } finally {
      setPlanLoading(false);
    }
  }

  async function generateAnalysis() {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "weekly" }),
      });
      const data = await res.json();
      if (data.error) {
        setAnalysisError(data.error);
      } else {
        setAnalysis(data.analysis);
      }
    } catch {
      setAnalysisError("Failed to generate analysis");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleOverride() {
    try {
      await fetch("/api/advisor/phase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: overridePhase,
          reason: overrideReason || undefined,
        }),
      });
      setShowOverride(false);
      setOverrideReason("");
      loadPhase();
    } catch {
      // ignore
    }
  }

  async function clearOverride() {
    try {
      await fetch("/api/advisor/phase", { method: "DELETE" });
      loadPhase();
    } catch {
      // ignore
    }
  }

  const isLoading = sessionLoading || planLoading || analysisLoading;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Coach</h1>
          <p className="text-sm text-gray-500 mt-1">
            Training plans, sessions, and analysis
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md transition-colors"
        >
          Dashboard
        </Link>
      </div>

      {/* Current phase */}
      {!phaseLoading && phase && (
        <div className={`border rounded-lg p-4 mb-6 ${phaseColor(phase.phase)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">
                Current Phase: {phase.label}
              </h2>
              {phase.isOverride && (
                <span className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded">
                  Manual override
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {phase.isOverride && (
                <button
                  onClick={clearOverride}
                  className="text-[10px] opacity-70 hover:opacity-100 transition-opacity"
                >
                  Clear override
                </button>
              )}
              <button
                onClick={() => setShowOverride(!showOverride)}
                className="text-[10px] opacity-70 hover:opacity-100 transition-opacity"
              >
                {showOverride ? "Cancel" : "Override"}
              </button>
            </div>
          </div>
          <p className="text-xs opacity-80">{phase.description}</p>
          {phase.weeksToRace != null && phase.targetRace && (
            <p className="text-xs mt-2 font-medium">
              {phase.weeksToRace} weeks to {phase.targetRace}
            </p>
          )}
        </div>
      )}

      {/* Phase override form */}
      {showOverride && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Override Training Phase
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phase</label>
              <select
                value={overridePhase}
                onChange={(e) => setOverridePhase(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PHASES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Reason (optional)
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Extended base due to injury"
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleOverride}
            className="text-xs text-white bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-md transition-colors"
          >
            Set Phase
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {([
          { key: "session" as ActiveTab, label: "Today's Session" },
          { key: "plan" as ActiveTab, label: "Weekly Plan" },
          { key: "analysis" as ActiveTab, label: "Weekly Analysis" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm px-4 py-2.5 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-gray-900 text-gray-900 font-medium"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Today's Session ── */}
      {activeTab === "session" && (
        <div>
          <div className="mb-6">
            <button
              onClick={generateSession}
              disabled={isLoading}
              className="text-xs text-white bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 px-4 py-2 rounded-md transition-colors"
            >
              {sessionLoading
                ? "Thinking..."
                : session
                ? "Regenerate Session"
                : "What should I do today?"}
            </button>
          </div>

          {sessionLoading && (
            <div className="flex items-center gap-3 py-8">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">
                Checking your recovery and recent training...
              </span>
            </div>
          )}

          {sessionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{sessionError}</p>
            </div>
          )}

          {session && !sessionLoading && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-700">
                  Today&apos;s Session
                </h2>
                <span className="text-xs text-gray-400">
                  {new Date().toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-gray-600">
                {renderMarkdown(session)}
              </div>
            </div>
          )}

          {!session && !sessionLoading && !sessionError && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-2">
                Get a personalised session suggestion based on your recovery, training load, and phase
              </p>
              <p className="text-xs text-gray-300">
                Key sessions get full detail — easy days stay simple
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Weekly Plan ── */}
      {activeTab === "plan" && (
        <div>
          <div className="mb-6">
            <button
              onClick={generatePlan}
              disabled={isLoading}
              className="text-xs text-white bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 px-4 py-2 rounded-md transition-colors"
            >
              {planLoading
                ? "Planning..."
                : plan
                ? "Regenerate Plan"
                : "Generate Weekly Plan"}
            </button>
          </div>

          {planLoading && (
            <div className="flex items-center gap-3 py-8">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">
                Building your training plan for the week...
              </span>
            </div>
          )}

          {planError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{planError}</p>
            </div>
          )}

          {plan && !planLoading && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-700">
                  Weekly Training Plan
                </h2>
                <span className="text-xs text-gray-400">
                  Week of{" "}
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-gray-600">
                {renderMarkdown(plan)}
              </div>
            </div>
          )}

          {!plan && !planLoading && !planError && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-2">
                Generate a structured 7-day training plan tailored to your phase and recovery
              </p>
              <p className="text-xs text-gray-300">
                Balances swim, bike, and run with detailed key sessions
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Weekly Analysis ── */}
      {activeTab === "analysis" && (
        <div>
          <div className="mb-6">
            <button
              onClick={generateAnalysis}
              disabled={isLoading}
              className="text-xs text-white bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 px-4 py-2 rounded-md transition-colors"
            >
              {analysisLoading
                ? "Analysing..."
                : analysis
                ? "Regenerate Analysis"
                : "Generate Weekly Analysis"}
            </button>
          </div>

          {analysisLoading && (
            <div className="flex items-center gap-3 py-8">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">
                Analysing your training data...
              </span>
            </div>
          )}

          {analysisError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{analysisError}</p>
            </div>
          )}

          {analysis && !analysisLoading && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-700">
                  Weekly Analysis
                </h2>
                <span className="text-xs text-gray-400">
                  {new Date().toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-gray-600">
                {renderMarkdown(analysis)}
              </div>
            </div>
          )}

          {!analysis && !analysisLoading && !analysisError && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-2">
                Get a detailed review of your recent training with specific recommendations
              </p>
              <p className="text-xs text-gray-300">
                Uses your Strava activities, Whoop recovery data, and race goals
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
