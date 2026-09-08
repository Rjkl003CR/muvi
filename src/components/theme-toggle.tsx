"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="theme-toggle-btn"
        aria-label="Toggle theme"
        style={{
          position: "relative",
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all var(--transition-base)",
        }}
      >
        <Sun style={{ width: 18, height: 18, color: "var(--accent-gold)" }} />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      style={{
        position: "relative",
        width: 40,
        height: 40,
        borderRadius: 10,
        border: "1px solid var(--border-color)",
        background: "var(--bg-card)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all var(--transition-base)",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.boxShadow = "var(--shadow-glow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-color)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <Sun
        style={{
          width: 18,
          height: 18,
          color: "var(--accent-gold)",
          position: "absolute",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isDark ? "rotate(-90deg) scale(0)" : "rotate(0) scale(1)",
          opacity: isDark ? 0 : 1,
        }}
      />
      <Moon
        style={{
          width: 18,
          height: 18,
          color: "var(--accent-pink)",
          position: "absolute",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isDark ? "rotate(0) scale(1)" : "rotate(90deg) scale(0)",
          opacity: isDark ? 1 : 0,
        }}
      />
    </button>
  );
}
