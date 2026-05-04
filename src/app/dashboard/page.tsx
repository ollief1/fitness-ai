"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ActivityCard from "@/components/ActivityCard";
import SummaryCards from "@/components/SummaryCards";
import WhoopRecoveryPanel from "@/components/WhoopRecovery";
import WhoopSleepPanel from "@/components/WhoopSleep";
import WhoopStrainPanel from "@/components/WhoopStrain";
import GarminBodyBatteryPanel from "@/components/GarminBodyBattery";
import UpcomingRaces from "@/components/UpcomingRaces";
import WeeklyVolume from "@/components/WeeklyVolume";
import TrainingLoad from "@/components/TrainingLoad";
import AdvisorCard from "@/components/AdvisorCard";
import TodaySession from "@/components/TodaySession";
import WeekPlanCard from "@/components/WeekPlanCard";

interface Activity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  suffer_score?: number;
  average_cadence?: number;
  average_watts?: number;
  kilojoules?: number;
  has_heartrate: boolean;
}

interface Athlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
}

interface WhoopData {
  connected: boolean;
  recoveries: Array<{
    date: string;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
  }>;
  sleeps: Array<{
    id: string;
    date: string;
    start: string;
    end: string;
    score?: {
      stage_summary?: {
        total_in_bed_time_milli: number;
        total_awake_time_milli: number;
        total_light_sleep_time_milli: number;
        total_slow_wave_sleep_time_milli: number;
        total_rem_sleep_time_milli: number;
        sleep_cycle_count: number;
      };
      sleep_performance_percentage?: number;
      sleep_efficiency_percentage?: number;
      respiratory_rate?: number;
    };
  }>;
  cycles: Array<{
    id: string;
    date: string;
    start: string;
    end: string;
    strain?: number;
    kilojoule?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
  }>;
}

interface GarminData {
  connected: boolean;
  daily_summary: Array<{
    date: string;
    body_battery_high?: number;
    body_battery_low?: number;
    avg_stress?: number;
    steps?: number;
    resting_hr?: number;
  }>;
}

type FilterType = "All" | "Swim" | "Ride" | "Run";

export default function Dashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [whoopData, setWhoopData] = useState<WhoopData | null>(null);
  const [garminData, setGarminData] = useState<GarminData | null>(null);
  const [raceGoals, setRaceGoals] = useState<Array<{
    id: string; name: string; date: string; discipline: string;
    distance: string; priority: "A" | "B" | "C"; target_time?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("All");
  const [showActivities, setShowActivities] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch all data in parallel
        const [stravaRes, whoopRes, garminRes, goalsRes] = await Promise.all([
          fetch("/api/strava/activities"),
          fetch("/api/whoop/data"),
          fetch("/api/garmin/data"),
          fetch("/api/goals"),
        ]);

        const stravaData = await stravaRes.json();
        const whoopJson = await whoopRes.json();
        const garminJson = await garminRes.json();
        const goalsJson = await goalsRes.json();

        if (stravaRes.status === 401) {
          window.location.href = "/";
          return;
        }

        setActivities(stravaData.activities || []);
        setAthlete(stravaData.athlete || null);
        setWhoopData(whoopJson);
        setGarminData(garminJson);
        setRaceGoals(goalsJson.goals || []);
      } catch (err) {
        setError("Failed to load data. Please try refreshing.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredActivities = activities.filter((a) => {
    if (filter === "All") return true;
    if (filter === "Swim") return a.type === "Swim";
    if (filter === "Ride")
      return a.type === "Ride" || a.type === "VirtualRide" || a.type === "EBikeRide";
    if (filter === "Run")
      return a.type === "Run" || a.type === "Trail Run";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Syncing your data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-red-500 mb-4">{error}</p>
          <a href="/" className="text-sm text-blue-600 hover:underline">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  const whoopConnected = whoopData?.connected === true;
  const garminConnected = garminData?.connected === true;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fitness AI</h1>
          {athlete && (
            <p className="text-sm text-gray-500">
              {athlete.firstname} {athlete.lastname}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/advisor"
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md transition-colors"
          >
            AI Coach
          </Link>
          <Link
            href="/goals"
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md transition-colors"
          >
            Goals
          </Link>
          {!whoopConnected && (
            <a
              href="/api/whoop/auth"
              className="text-xs text-white bg-gray-900 hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors"
            >
              Connect Whoop
            </a>
          )}
          {garminConnected && (
            <button
              onClick={async () => {
                try {
                  await fetch("/api/garmin/sync", { method: "POST" });
                  window.location.reload();
                } catch {}
              }}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md transition-colors"
            >
              Sync Garmin
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6">
        <SummaryCards activities={activities} />
      </div>

      {/* Upcoming races */}
      {raceGoals.length > 0 && (
        <div className="mb-6">
          <UpcomingRaces goals={raceGoals} />
        </div>
      )}

      {/* AI Coach insight */}
      <div className="mb-6">
        <AdvisorCard />
      </div>

      {/* Today's session + Weekly plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TodaySession />
        <WeekPlanCard />
      </div>

      {/* Whoop panels (if connected) */}
      {whoopConnected &&
        (whoopData.recoveries.length > 0 ||
          whoopData.sleeps.length > 0 ||
          whoopData.cycles.length > 0) && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              Recovery & Sleep
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <WhoopRecoveryPanel recoveries={whoopData.recoveries} />
              <WhoopSleepPanel sleeps={whoopData.sleeps} />
              <WhoopStrainPanel cycles={whoopData.cycles} />
            </div>
          </div>
        )}

      {/* Whoop connect prompt */}
      {!whoopConnected && (
        <div className="mb-6 bg-gray-50 border border-gray-200 border-dashed rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Connect your Whoop to see recovery, sleep, and strain data
          </p>
          <a
            href="/api/whoop/auth"
            className="inline-flex text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Connect Whoop →
          </a>
        </div>
      )}

      {/* Garmin panels (if connected) */}
      {garminConnected && garminData.daily_summary.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Garmin
          </h2>
          <GarminBodyBatteryPanel dailySummary={garminData.daily_summary} />
        </div>
      )}

      {/* Garmin connect prompt */}
      {!garminConnected && (
        <div className="mb-6 bg-gray-50 border border-gray-200 border-dashed rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Connect your Garmin to see body battery, sleep, and HRV data
          </p>
          <p className="text-xs text-gray-400">
            Run: <code className="bg-gray-100 px-1.5 py-0.5 rounded">python3 scripts/garmin_sync.py --setup</code> in the project folder
          </p>
        </div>
      )}

      {/* Weekly volume by discipline */}
      <div className="mb-6">
        <WeeklyVolume activities={activities} />
      </div>

      {/* Training load trend */}
      <div className="mb-6">
        <TrainingLoad activities={activities} />
      </div>

      {/* Activity list toggle */}
      <button
        onClick={() => setShowActivities(!showActivities)}
        className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <span className="font-medium">
          Activities ({activities.length})
        </span>
        <span className="text-xs">
          {showActivities ? "Hide" : "Show"}
        </span>
      </button>

      {showActivities && (
        <>
          {/* Activity filter */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-400">Filter:</span>
            {(["All", "Swim", "Ride", "Run"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  filter === f
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-auto">
              {filteredActivities.length} activities
            </span>
          </div>

          {/* Activity list */}
          <div className="space-y-2">
            {filteredActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </>
      )}

      {activities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            No activities found. Make sure your Strava account has some
            recorded activities.
          </p>
        </div>
      )}
    </div>
  );
}
