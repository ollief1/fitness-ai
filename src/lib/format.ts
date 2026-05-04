// Formatting helpers for displaying activity data

export function formatDistance(metres: number): string {
  if (metres >= 1000) {
    return `${(metres / 1000).toFixed(1)} km`;
  }
  return `${Math.round(metres)} m`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
}

export function formatPace(metersPerSecond: number, type: string): string {
  if (metersPerSecond === 0) return "-";

  // Running/walking: min/km
  if (type === "Run" || type === "Walk" || type === "Hike" || type === "Trail Run") {
    const secPerKm = 1000 / metersPerSecond;
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.round(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, "0")} /km`;
  }

  // Cycling: km/h
  if (type === "Ride" || type === "VirtualRide" || type === "EBikeRide") {
    return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
  }

  // Swimming: min/100m
  if (type === "Swim") {
    const secPer100m = 100 / metersPerSecond;
    const mins = Math.floor(secPer100m / 60);
    const secs = Math.round(secPer100m % 60);
    return `${mins}:${secs.toString().padStart(2, "0")} /100m`;
  }

  // Default: km/h
  return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatElevation(metres: number): string {
  return `${Math.round(metres)} m`;
}

export function getActivityEmoji(type: string): string {
  const map: Record<string, string> = {
    Run: "🏃",
    "Trail Run": "🏃",
    Ride: "🚴",
    VirtualRide: "🚴",
    EBikeRide: "🚴",
    Swim: "🏊",
    Walk: "🚶",
    Hike: "🥾",
    WeightTraining: "🏋️",
    Yoga: "🧘",
    Workout: "💪",
  };
  return map[type] || "🏅";
}
