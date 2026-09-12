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
      if (data?.session?.provider_token) {
        res.cookies.set("google_access_token", encodeURIComponent(data.session.provider_token), {
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: "lax",
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
