"use client";

import {
  formatDistance,
  formatDuration,
  formatPace,
  formatDate,
  formatElevation,
  getActivityEmoji,
} from "@/lib/format";

interface Activity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  average_speed: number;
  average_heartrate?: number;
  has_heartrate: boolean;
}

export default function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getActivityEmoji(activity.type)}</span>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">
              {activity.name}
            </h3>
            <p className="text-xs text-gray-400">
              {formatDate(activity.start_date_local)}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
          {activity.type}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
        <Stat label="Distance" value={formatDistance(activity.distance)} />
        <Stat label="Time" value={formatDuration(activity.moving_time)} />
        <Stat
          label="Pace"
          value={formatPace(activity.average_speed, activity.type)}
        />
        {activity.total_elevation_gain > 0 ? (
          <Stat
            label="Elevation"
            value={formatElevation(activity.total_elevation_gain)}
          />
        ) : activity.has_heartrate && activity.average_heartrate ? (
          <Stat
            label="Avg HR"
            value={`${Math.round(activity.average_heartrate)} bpm`}
          />
        ) : (
          <Stat label="Elevation" value="—" />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
