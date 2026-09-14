"use client";

import { useEffect, useState, use } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Channel } from "@/types/chat";
import { createClient } from "@/utils/supabase/client";
import { usePresence } from "@/hooks/usePresence";
import { Loader2 } from "lucide-react";

export default function CategoryChatPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  
  // Normalize URL param to channel type
  const activeType = category === "dms" ? "dm" : category === "genres" ? "genre" : "general";
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Using a global presence channel for "who is online in the app"
  const { onlineUsers } = usePresence("global");

  useEffect(() => {
    let isMounted = true;

    const fetchChannels = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("type", activeType)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching channels:", error);
      } 
      
      if (isMounted) {
        let fetchedChannels = data as Channel[] | null;
        // Inject sample data if no channels exist or on error
        if (!fetchedChannels || fetchedChannels.length === 0) {
          if (activeType === "general") {
            fetchedChannels = [
              { id: 'demo-channel-1', name: 'General Lounge', type: 'general', created_at: new Date().toISOString() },
              { id: 'demo-channel-announcements', name: 'Announcements', type: 'general', created_at: new Date().toISOString() }
            ];
          } else if (activeType === "genre") {
            fetchedChannels = [
              { id: 'demo-channel-2', name: 'Sci-Fi Talk', type: 'genre', created_at: new Date().toISOString() },
              { id: 'demo-channel-horror', name: 'Horror Fans', type: 'genre', created_at: new Date().toISOString() }
            ];
          } else if (activeType === "dm") {
            fetchedChannels = [
              { id: 'demo-channel-3', name: 'Alice', type: 'dm', created_at: new Date().toISOString() },
              { id: 'demo-channel-bob', name: 'Bob', type: 'dm', created_at: new Date().toISOString() }
            ];
          }
        }
        setChannels(fetchedChannels || []);
        if (fetchedChannels && fetchedChannels.length > 0) {
          setActiveChannel(fetchedChannels[0]);
        } else {
          setActiveChannel(null);
        }
      }

      if (isMounted) setLoading(false);
    };

    fetchChannels();

    return () => {
      isMounted = false;
    };
  }, [supabase, activeType]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <ChatSidebar
        channels={channels}
        activeChannel={activeChannel}
        onSelectChannel={setActiveChannel}
        onlineUsers={onlineUsers}
      />

      <main className="flex-1 flex flex-col relative h-full">
        {activeChannel ? (
          <ChatWindow
            channelId={activeChannel.id}
            channelName={activeChannel.name || "Unknown"}
            onlineUsersCount={onlineUsers.length}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] p-8 text-center max-w-md mx-auto">
            Select a channel to start chatting.
          </div>
        )}
      </main>
    </div>
  );
}
