"use client";

import { useMemo } from "react";
import { formatDistance, formatDuration } from "@/lib/format";

interface Activity {
  type: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
}

export default function SummaryCards({
  activities,
}: {
  activities: Activity[];
}) {
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent = activities.filter(
      (a) => new Date(a.start_date_local) >= thirtyDaysAgo
    );

    const totalDistance = recent.reduce((s, a) => s + a.distance, 0);
    const totalTime = recent.reduce((s, a) => s + a.moving_time, 0);
    const totalElevation = recent.reduce(
      (s, a) => s + a.total_elevation_gain,
      0
    );
    const activityCount = recent.length;

    // Breakdown by discipline
    const swims = recent.filter((a) => a.type === "Swim");
    const rides = recent.filter(
      (a) => a.type === "Ride" || a.type === "VirtualRide"
    );
    const runs = recent.filter(
      (a) => a.type === "Run" || a.type === "Trail Run"
    );

    return {
      totalDistance,
      totalTime,
      totalElevation,
      activityCount,
      swimCount: swims.length,
      rideCount: rides.length,
      runCount: runs.length,
    };
  }, [activities]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card label="Activities (30d)" value={stats.activityCount.toString()} />
      <Card label="Total Distance" value={formatDistance(stats.totalDistance)} />
      <Card label="Total Time" value={formatDuration(stats.totalTime)} />
      <Card
        label="Discipline Split"
        value={`${stats.swimCount}S / ${stats.rideCount}B / ${stats.runCount}R`}
      />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
