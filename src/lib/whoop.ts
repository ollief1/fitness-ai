// Whoop API integration

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v1";
const WHOOP_API_V2 = "https://api.prod.whoop.com/developer/v2";
const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

export function getWhoopAuthUrl(): string {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/whoop/callback`;

  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope:
      "read:recovery read:sleep read:workout read:cycles read:profile read:body_measurement offline",
    state: "whoop_auth",
  });

  return `${WHOOP_AUTH_URL}?${params.toString()}`;
}

export async function exchangeWhoopCode(code: string) {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/whoop/callback`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env.WHOOP_CLIENT_ID || "",
    client_secret: process.env.WHOOP_CLIENT_SECRET || "",
    redirect_uri: redirectUri,
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whoop token exchange failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function refreshWhoopToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.WHOOP_CLIENT_ID || "",
    client_secret: process.env.WHOOP_CLIENT_SECRET || "",
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Whoop token refresh failed: ${res.statusText}`);
  }

  return res.json();
}

// ── API calls ──

async function whoopGet(path: string, accessToken: string) {
  const url = `${WHOOP_API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Whoop API error: ${res.status} ${res.statusText} - ${body.slice(0, 200)}`);
  }

  return res.json();
}

export async function getWhoopProfile(accessToken: string) {
  return whoopGet("/user/profile/basic", accessToken);
}

export async function getRecoveries(
  accessToken: string,
  startDate?: string,
  endDate?: string
) {
  const bases = [WHOOP_API_BASE, WHOOP_API_V2];
  for (const base of bases) {
    let path = "/recovery?limit=25";
    if (startDate) path += `&start=${startDate}`;
    if (endDate) path += `&end=${endDate}`;
    try {
      const res = await fetch(`${base}${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) return res.json();
    } catch {
      // Try next base URL
    }
  }
  return { records: [] };
}

export async function getSleeps(
  accessToken: string,
  startDate?: string,
  endDate?: string
) {
  const sleepAttempts = [
    `${WHOOP_API_BASE}/activity/sleep?limit=25`,
    `${WHOOP_API_V2}/activity/sleep?limit=25`,
    `${WHOOP_API_BASE}/sleep?limit=25`,
    `${WHOOP_API_V2}/sleep?limit=25`,
  ];

  for (const baseUrl of sleepAttempts) {
    let url = baseUrl;
    if (startDate) url += `&start=${startDate}`;
    if (endDate) url += `&end=${endDate}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) return res.json();
    } catch {
      // Try next URL
    }
  }
  return { records: [] };
}

export async function getWorkouts(
  accessToken: string,
  startDate?: string,
  endDate?: string
) {
  const workoutAttempts = [
    `${WHOOP_API_BASE}/activity/workout?limit=25`,
    `${WHOOP_API_V2}/activity/workout?limit=25`,
    `${WHOOP_API_BASE}/workout?limit=25`,
    `${WHOOP_API_V2}/workout?limit=25`,
  ];

  for (const baseUrl of workoutAttempts) {
    let url = baseUrl;
    if (startDate) url += `&start=${startDate}`;
    if (endDate) url += `&end=${endDate}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) return res.json();
    } catch {
      // Try next URL
    }
  }
  return { records: [] };
}

export async function getCycles(
  accessToken: string,
  startDate?: string,
  endDate?: string
) {
  let path = "/cycle?limit=25";
  if (startDate) path += `&start=${startDate}`;
  if (endDate) path += `&end=${endDate}`;
  return whoopGet(path, accessToken);
}
