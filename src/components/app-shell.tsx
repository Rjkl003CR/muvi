"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { useSidebar } from "./sidebar-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <div className="app-shell">
      <Sidebar />
      <main
        className="app-main"
        style={{ marginLeft: sidebarWidth }}
      >
        {children}
      </main>
    </div>
  );
}
