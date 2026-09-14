"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Film, MessageCircle } from "lucide-react";

export function ChatNavColumn() {
  const pathname = usePathname();

  const navItems = [
    {
      id: "general",
      href: "/chat/general",
      icon: Users,
      label: "General",
      // Dummy unread badge
      unreadCount: 0,
    },
    {
      id: "genres",
      href: "/chat/genres",
      icon: Film,
      label: "Genres",
      unreadCount: 2, // mock unread count
    },
    {
      id: "dms",
      href: "/chat/dms",
      icon: MessageCircle,
      label: "Direct Messages",
      unreadCount: 5, // mock unread count
    },
  ];

  return (
    <div className="w-16 h-full border-r flex flex-col items-center py-4 gap-4 shrink-0" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.id}
            href={item.href}
            title={item.label}
            className={`relative p-3 rounded-xl transition-all ${
              isActive 
                ? "text-white shadow-md" 
                : "text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
            }`}
            style={isActive ? { background: 'var(--gradient-accent)' } : {}}
          >
            <Icon size={22} />
            {item.unreadCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-sm"
                style={{ background: '#ef4444' }}
              >
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
