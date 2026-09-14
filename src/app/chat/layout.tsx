"use client";

import { ChatNavColumn } from "@/components/chat/ChatNavColumn";
import { MessageSquare } from "lucide-react";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Top Header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "24px 32px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--gradient-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 18px rgba(240,100,73,0.3)",
            }}
          >
            <MessageSquare style={{ width: 22, height: 22, color: "white" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.65rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Muvi Chat
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden border-t" style={{ borderColor: 'var(--border-color)' }}>
        {/* New Navigation Column */}
        <ChatNavColumn />
        
        {/* Category Page Content (Sidebar + Window) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
}
