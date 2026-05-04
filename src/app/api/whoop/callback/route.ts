import { NextRequest, NextResponse } from "next/server";
import { exchangeWhoopCode, getWhoopProfile } from "@/lib/whoop";
import { saveWhoopTokens } from "@/lib/whoop-store";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    console.error("Whoop auth error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?whoop_error=access_denied", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard?whoop_error=no_code", request.url)
    );
  }

  try {
    const tokenData = await exchangeWhoopCode(code);

    // Calculate expires_at from expires_in
    const expiresAt = Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600);

    await saveWhoopTokens({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
    });

    // Try to get profile to store user_id
    try {
      const profile = await getWhoopProfile(tokenData.access_token);
      await saveWhoopTokens({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        user_id: profile.user_id,
      });
    } catch {
      // Profile fetch is optional
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("Whoop token exchange error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?whoop_error=auth_failed", request.url)
    );
  }
}
