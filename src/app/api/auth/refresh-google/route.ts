import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Refresh the Google access token using the stored refresh token.
// This endpoint is called by the client when the access token cookie has expired.
// It uses Supabase's Google OAuth credentials (configured in the Supabase dashboard)
// to exchange the refresh token for a new access token via Google's token endpoint.

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("google_refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token available. Please re-authenticate with Google." },
        { status: 401 }
      );
    }

    // Use Google's token endpoint to get a new access token
    // The client ID and secret are from Supabase's Google provider config
    // We need to get them from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Google OAuth credentials not configured on server. Please re-authenticate." },
        { status: 500 }
      );
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.text();
      console.error("Google token refresh failed:", errData);
      return NextResponse.json(
        { error: "Failed to refresh Google token. Please re-authenticate." },
        { status: 401 }
      );
    }

    const tokenData = await tokenRes.json();
    const newAccessToken = tokenData.access_token;

    if (!newAccessToken) {
      return NextResponse.json(
        { error: "No access token in refresh response. Please re-authenticate." },
        { status: 401 }
      );
    }

    // Set the new access token cookie
    const res = NextResponse.json({ success: true, accessToken: newAccessToken });
    res.cookies.set("google_access_token", newAccessToken, {
      path: "/",
      maxAge: 3500, // ~58 minutes
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refresh token" },
      { status: 500 }
    );
  }
}
