export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fitness AI</h1>
        <p className="text-gray-500 mb-8">
          Connect your Strava account to see your training data.
        </p>

        <a
          href="/api/strava/auth"
          className="inline-flex items-center gap-2 bg-[#fc4c02] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e0430a] transition-colors"
        >
          Connect Strava
        </a>

        <p className="text-xs text-gray-400 mt-6">
          Your training data is synced securely from Strava and Whoop.
        </p>
      </div>
    </div>
  );
}
