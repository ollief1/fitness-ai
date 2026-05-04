"use client";

import { useState } from "react";
import Link from "next/link";

export default function TodaySession() {
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "session" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSession(data.session);
      }
    } catch {
      setError("Failed to generate session");
    } finally {
      setLoading(false);
    }
  }

  // Extract a short summary from the full session text (first meaningful paragraph)
  function getPreview(text: string): string {
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    // Collect non-header lines for preview
    const preview: string[] = [];
    for (const line of lines) {
      if (line.startsWith("#") || line.startsWith("**")) continue;
      preview.push(line.replace(/\*\*/g, ""));
      if (preview.length >= 3) break;
    }
    return preview.join(" ").slice(0, 200) + (preview.join(" ").length > 200 ? "..." : "");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Today&apos;s Session</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/advisor"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Full detail
          </Link>
          {!loading && (
            <button
              onClick={loadSession}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {session ? "Refresh" : "Generate"}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs text-gray-400">Working out what you should do today...</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 py-2">{error}</p>
      )}

      {session && !loading && (
        <p className="text-sm text-gray-600 leading-relaxed">
          {getPreview(session)}
        </p>
      )}

      {!session && !loading && !error && (
        <p className="text-xs text-gray-400 py-2">
          Click &quot;Generate&quot; for a personalised session based on your recovery and training load.
        </p>
      )}
    </div>
  );
}
