import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { NavLink } from "@/components/nav-link";
import { Film, Download, Library } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "muvi — Movie Downloader & Library",
  description:
    "Download movies from any URL and build your personal cloud library. Powered by Google Drive.",
  keywords: "movie downloader, movie library, google drive, cloud storage, streaming",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          transition: "background var(--transition-slow), color var(--transition-slow)",
        }}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {/* ── Header / Navigation ── */}
          <header className="nav-header">
            <div
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: "0 24px",
                height: 64,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Logo + Nav Links */}
              <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "var(--gradient-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 12px rgba(240, 100, 73, 0.25)",
                    }}
                  >
                    <Film style={{ width: 18, height: 18, color: "white" }} />
                  </div>
                  <span className="logo-text">muvi</span>
                </div>

                <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <NavLink href="/">
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Download style={{ width: 15, height: 15 }} />
                      Download
                    </span>
                  </NavLink>
                  <NavLink href="/library">
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Library style={{ width: 15, height: 15 }} />
                      Library
                    </span>
                  </NavLink>
                </nav>
              </div>

              {/* Auth + Theme */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <AuthButton />
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* ── Main Content ── */}
          <main style={{ flex: 1 }}>{children}</main>

          {/* ── Footer ── */}
          <footer
            style={{
              padding: "20px 24px",
              textAlign: "center",
              borderTop: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              muvi — Your personal movie cloud ✦ Built with Next.js & Google Drive
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
