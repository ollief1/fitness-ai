// Strava API integration

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export function getStravaAuthUrl(): string {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/strava/callback`;

  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read,activity:read_all,profile:read_all",
    approval_prompt: "auto",
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.statusText}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.statusText}`);
  }

  return res.json();
}

export async function getActivities(
  accessToken: string,
  page: number = 1,
  perPage: number = 50
) {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch activities: ${res.statusText}`);
  }

  return res.json();
}

export async function getAthlete(accessToken: string) {
  const res = await fetch(`${STRAVA_API_BASE}/athlete`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch athlete: ${res.statusText}`);
  }

  return res.json();
}
