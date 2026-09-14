import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';
  
  if (code) {
    const supabase = await createClient();
    
    // Exchange the auth code for a session (this gets the Google token)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successfully authenticated! Redirect back to the app
      const res = NextResponse.redirect(`${requestUrl.origin}${next}`);
      
      // Save the Google Drive provider token so the frontend can use it
      // Google access tokens expire in ~1 hour, so set cookie maxAge accordingly
      if (data?.session?.provider_token) {
        res.cookies.set("google_access_token", data.session.provider_token, {
          path: "/",
          maxAge: 3500, // ~58 minutes (Google tokens expire in 1 hour)
          sameSite: "lax",
          httpOnly: false, // needs to be readable by client JS
          secure: process.env.NODE_ENV === "production",
        });
      }

      // Save the provider refresh token if available (for getting new access tokens)
      if (data?.session?.provider_refresh_token) {
        res.cookies.set("google_refresh_token", data.session.provider_refresh_token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: "lax",
          httpOnly: true, // refresh token should be httpOnly for security
          secure: process.env.NODE_ENV === "production",
        });
      }

      return res;
    } else {
      console.error("Auth Callback Error:", error.message);
    }
  }

  // Fallback redirect if something fails
  return NextResponse.redirect(`${requestUrl.origin}/?error=auth-failed`);
}
