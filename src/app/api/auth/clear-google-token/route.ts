import { NextResponse } from "next/server";

// Utility endpoint to clear the stale Google access token cookie
export async function GET() {
  const res = NextResponse.json({ success: true, message: "Google access token cookie cleared" });
  res.cookies.set("google_access_token", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return res;
}
