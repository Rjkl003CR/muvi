import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/sidebar-context";
import { TopNavbar } from "@/components/top-navbar";
import { AppShell } from "@/components/app-shell";
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
      <body style={{ margin: 0, minHeight: "100vh", background: "var(--bg-primary)" }}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SidebarProvider>
            <TopNavbar />
            <AppShell>{children}</AppShell>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
