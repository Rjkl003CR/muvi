"use client";

import { useState, useEffect } from "react";
import { Channel } from "@/types/chat";
import { Hash, MessageSquare, Users } from "lucide-react";

interface ChatSidebarProps {
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onlineUsers?: string[]; // user IDs of online users
}

export function ChatSidebar({
  channels,
  activeChannel,
  onSelectChannel,
  onlineUsers = [],
}: ChatSidebarProps) {
  // Since channels are now filtered by the parent, we just render them
  // We can determine the category title and icon from the first channel's type
  const type = channels.length > 0 ? channels[0].type : "general";
  const title = type === "dm" ? "Direct Messages" : type === "genre" ? "Genres" : "General";
  const icon = type === "dm" ? <MessageSquare size={14} /> : type === "genre" ? <Hash size={14} /> : <Users size={14} />;

  // Local state to track which channels have been read (clicked) to clear the notification
  const [readChannels, setReadChannels] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeChannel) {
      setReadChannels(prev => {
        const next = new Set(prev);
        next.add(activeChannel.id);
        return next;
      });
    }
  }, [activeChannel]);

  const renderChannelList = (list: Channel[], titleText: string, iconNode: React.ReactNode) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-[var(--text-muted)]">
          {icon} {title}
        </h3>
        <ul className="space-y-1">
          {list.map((channel) => (
            <li key={channel.id}>
              <button
                onClick={() => onSelectChannel(channel)}
                className={`w-full text-left px-4 py-2 rounded-md transition-all text-sm flex items-center justify-between ${
                  activeChannel?.id === channel.id
                    ? "text-white shadow-md font-medium"
                    : "hover:bg-[var(--bg-card)] text-[var(--text-secondary)]"
                }`}
                style={activeChannel?.id === channel.id ? { background: 'var(--gradient-accent)' } : {}}
              >
                <span className="flex items-center gap-2 truncate">
                  <div className="relative flex shrink-0 items-center justify-center">
                    {channel.type === "dm" && <MessageSquare size={16} className="opacity-70" />}
                    {/* Online indicator dot for DMs */}
                    {channel.type === "dm" && (channel.name?.includes("Alice") || channel.name?.includes("Bob")) && (
                      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 border-[1.5px]" style={{ borderColor: activeChannel?.id === channel.id ? 'transparent' : 'var(--bg-card)' }}></span>
                    )}
                  </div>
                  <span className="truncate">{channel.name || "Unknown DM"}</span>
                </span>
                {/* Dummy indicator for unread messages */}
                {channel.name?.includes("Lounge") && !readChannels.has(channel.id) && (
                   <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#ef4444' }}></span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="w-56 border-r h-full flex flex-col overflow-y-auto hidden md:flex shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="p-2 flex-1 overflow-y-auto mt-2">
        {renderChannelList(channels, title, icon)}
      </div>
    </div>
  );
}
