"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LogIn, LogOut, User } from "lucide-react";
import { setAccessToken, removeAccessToken } from "@/utils/token";

export function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.provider_token) {
          setAccessToken(session.provider_token);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignIn = () => {
    router.push("/auth");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    removeAccessToken();
  };

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 10,
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-heading)",
          }}
        >
          <User style={{ width: 14, height: 14, color: "var(--accent)" }} />
          <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email?.split("@")[0]}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#ef4444",
            padding: "7px 14px",
            borderRadius: 10,
            cursor: "pointer",
            fontFamily: "var(--font-heading)",
            fontWeight: 500,
            fontSize: "0.8rem",
            transition: "all var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
          }}
        >
          <LogOut style={{ width: 14, height: 14 }} /> Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      id="nav-sign-in-btn"
      onClick={handleSignIn}
      className="btn-primary"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: "0.85rem",
        padding: "9px 20px",
      }}
    >
      <LogIn style={{ width: 16, height: 16 }} /> Sign In
    </button>
  );
}
