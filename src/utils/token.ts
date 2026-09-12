// Helper to store access tokens via secure cookies instead of localStorage
export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )google_access_token=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setAccessToken(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `google_access_token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function removeAccessToken() {
  if (typeof document === "undefined") return;
  document.cookie = "google_access_token=; path=/; max-age=0; SameSite=Lax";
}
