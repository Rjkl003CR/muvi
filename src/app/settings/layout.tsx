"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Sliders, Cloud } from 'lucide-react';

const settingsNav = [
  { label: 'Profile', href: '/settings/profile', icon: User },
  { label: 'Security & Privacy', href: '/settings/security', icon: Shield },
  { label: 'Theme', href: '/settings/theme', icon: Sliders },
  { label: 'Storage', href: '/settings/storage', icon: Cloud },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="w-full p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Heading */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "var(--gradient-accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 18px var(--accent-glow)",
        }}>
          <Sliders style={{ width: 22, height: 22, color: "white" }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.65rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account preferences and appearance.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Inner Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-3 overflow-x-auto pb-4 md:pb-0 px-2 -mx-2 pt-2 -mt-2 scrollbar-none">
            {settingsNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 ease-out whitespace-nowrap overflow-hidden border ${
                    active
                      ? "bg-accent/10 text-accent border-accent/20 shadow-[0_4px_20px_var(--accent-glow)]"
                      : "text-muted-foreground border-transparent bg-transparent hover:bg-card hover:text-foreground hover:shadow-sm hover:border-border/50"
                  }`}
                >
                  {/* Subtle shine effect on active */}
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  )}
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? "text-accent drop-shadow-md" : "group-hover:text-accent"}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Tab Content Area */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
