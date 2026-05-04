import { NextResponse } from "next/server";

export async function GET() {
  const hasKvUrl = !!process.env.KV_REST_API_URL;
  const hasKvToken = !!process.env.KV_REST_API_TOKEN;
  const kvUrlPrefix = process.env.KV_REST_API_URL?.slice(0, 30) + "...";

  // Try a simple KV read/write test
  let kvWorking = false;
  let kvError = "";

  if (hasKvUrl && hasKvToken) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set("debug:test", { ok: true, ts: Date.now() });
      const val = await kv.get("debug:test");
      kvWorking = val !== null;
    } catch (err) {
      kvError = (err as Error).message;
    }
  }

  // Check if Strava tokens exist
  let hasTokens = false;
  let tokenError = "";
  try {
    const { kv } = await import("@vercel/kv");
    const tokens = await kv.get("strava:tokens");
    hasTokens = tokens !== null;
  } catch (err) {
    tokenError = (err as Error).message;
  }

  return NextResponse.json({
    env: {
      hasKvUrl,
      hasKvToken,
      kvUrlPrefix: hasKvUrl ? kvUrlPrefix : null,
      isVercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
    },
    kv: {
      working: kvWorking,
      error: kvError || undefined,
    },
    strava: {
      hasTokens,
      error: tokenError || undefined,
    },
  });
}
