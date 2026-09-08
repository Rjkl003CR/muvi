"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { LogIn, LogOut } from "lucide-react";

export function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        // We can store the provider token in local storage or state to use for Google Drive uploads
        if (session?.provider_token) {
          localStorage.setItem("google_access_token", session.provider_token);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/drive.file",
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("google_access_token");
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">{user.email}</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
    >
      <LogIn className="w-4 h-4" /> Sign In with Google
    </button>
  );
}
