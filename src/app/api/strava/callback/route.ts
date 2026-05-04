import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/strava";
import { saveTokens } from "@/lib/store";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/?error=access_denied", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?error=no_code", request.url)
    );
  }

  try {
    const tokenData = await exchangeCodeForToken(code);

    await saveTokens({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      athlete: tokenData.athlete
        ? {
            id: tokenData.athlete.id,
            firstname: tokenData.athlete.firstname,
            lastname: tokenData.athlete.lastname,
            profile: tokenData.athlete.profile,
          }
        : undefined,
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("Strava auth error:", err);
    return NextResponse.redirect(
      new URL("/?error=auth_failed", request.url)
    );
  }
}
