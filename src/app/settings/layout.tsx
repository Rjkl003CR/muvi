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
    <div className="w-full max-w-6xl mx-auto p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Inner Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-3 overflow-x-auto pb-4 md:pb-0 scrollbar-none">
            {settingsNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 ease-out whitespace-nowrap overflow-hidden border ${
                    active
                      ? "bg-accent/15 text-accent border-accent/30 shadow-[0_0_20px_var(--accent-glow)] scale-[1.02]"
                      : "text-muted-foreground border-transparent bg-transparent hover:bg-card hover:text-foreground hover:shadow-sm hover:scale-[1.01] hover:border-border/50"
                  }`}
                >
                  {/* Subtle shine effect on active */}
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  )}
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? "text-accent scale-110 drop-shadow-md" : "group-hover:scale-110 group-hover:text-accent"}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Tab Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
