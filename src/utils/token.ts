// Helper to manage Google OAuth access tokens

export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )google_access_token=([^;]+)"));
  return match ? match[2] : null;
}

export function setAccessToken(token: string) {
  if (typeof document === "undefined") return;
  // Set to ~58 minutes to match Google's 1-hour token lifetime
  document.cookie = `google_access_token=${token}; path=/; max-age=3500; SameSite=Lax`;
}

export function removeAccessToken() {
  if (typeof document === "undefined") return;
  document.cookie = "google_access_token=; path=/; max-age=0; SameSite=Lax";
}

/**
 * Try to get a valid Google access token.
 * If the cookie has expired, attempt to refresh it via the server.
 * Returns the token string or null if unavailable.
 */
export async function getValidAccessToken(): Promise<string | null> {
  // First check if we have a non-expired cookie
  const existing = getAccessToken();
  if (existing) return existing;

  // Cookie expired — try refreshing via server endpoint
  try {
    const res = await fetch("/api/auth/refresh-google", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        return data.accessToken;
      }
    }
  } catch (e) {
    console.warn("Failed to refresh Google token:", e);
  }

  return null;
}
