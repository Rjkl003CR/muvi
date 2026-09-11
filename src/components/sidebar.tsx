"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  Library,
  MessageCircle,
  FileText,
  Zap,
  Settings,
  Film,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

const menuItems = [
  { label: "Download", href: "/", icon: Download },
  { label: "Library", href: "/library", icon: Library },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Shortcuts", href: "/shortcuts", icon: Zap },
  { label: "Settings", href: "/settings/profile", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="sidebar"
      style={{
        width: collapsed ? 64 : 240,
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "var(--gradient-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 12px rgba(240,100,73,0.3)",
            flexShrink: 0,
          }}
        >
          <Film style={{ width: 18, height: 18, color: "white" }} />
        </div>
        {!collapsed && (
          <span className="logo-text" style={{ fontSize: "1.4rem" }}>
            muvi
          </span>
        )}
      </div>

      {/* Menu label */}
      {!collapsed && (
        <p className="sidebar-menu-label">MENU</p>
      )}

      {/* Nav items */}
      <nav className="sidebar-nav">
        {menuItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-item${active ? " active" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon
                style={{
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                  color: active ? "white" : "var(--text-secondary)",
                  transition: "color 0.2s",
                }}
              />
              {!collapsed && (
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 500,
                    color: active ? "white" : "var(--text-secondary)",
                    transition: "color 0.2s",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
